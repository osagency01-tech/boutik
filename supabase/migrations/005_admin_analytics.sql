-- ============================================================
--  BOUTIK — Statistiques détaillées pour l'administration
--
--  Objectif : répondre aux questions qui décident du business,
--  pas afficher des compteurs. Concrètement :
--    - Est-ce que les vendeurs paient ? (conversion gratuit -> payant)
--    - Est-ce qu'ils restent ? (rétention, churn)
--    - Est-ce qu'ils vendent ? (activation, commandes par boutique)
--    - Combien ça rapporte ? (MRR, ARPU)
-- ============================================================

/* Revenu mensuel récurrent : LA métrique du SaaS.
   Calculé depuis les abonnements actifs, pas depuis les paiements
   encaissés — un paiement est ponctuel, un abonnement est récurrent. */
create or replace view admin_mrr
with (security_invoker = true)
as
select
  coalesce(sum(
    case s.plan
      when 'starter'  then 999
      when 'business' then 1999
      when 'premium'  then 4999
      else 0
    end
  ), 0)::bigint                                      as mrr,
  count(*) filter (where s.plan <> 'gratuit')        as abonnes_payants,
  /* ARPU : revenu moyen par boutique payante. S'il monte, les
     vendeurs montent en gamme. S'il baisse, ils rétrogradent. */
  case
    when count(*) filter (where s.plan <> 'gratuit') = 0 then 0
    else round(
      coalesce(sum(
        case s.plan
          when 'starter'  then 999
          when 'business' then 1999
          when 'premium'  then 4999
          else 0
        end
      ), 0)::numeric / count(*) filter (where s.plan <> 'gratuit')
    )
  end                                                as arpu
from shops s
where s.status in ('active', 'grace')
  and auth_is_admin()
/* GROUP BY sur le prédicat : sans lui, un agrégat renvoie une ligne
   de zéros même à un non-admin. Ici, aucune ligne n'est renvoyée. */
group by auth_is_admin();

/* Entonnoir d'activation : où perd-on les vendeurs ?
   C'est la vue la plus utile du back-office. */
create or replace view admin_funnel
with (security_invoker = true)
as
select
  count(*)                                                        as inscrits,
  count(*) filter (where exists (
    select 1 from products p where p.shop_id = s.id
  ))                                                              as ont_un_produit,
  count(*) filter (where (
    select count(*) from products p where p.shop_id = s.id
  ) >= 3)                                                         as ont_trois_produits,
  count(*) filter (where exists (
    select 1 from product_images i where i.shop_id = s.id
  ))                                                              as ont_une_photo,
  count(*) filter (where s.status in ('active', 'grace'))          as ont_publie,
  count(*) filter (where exists (
    select 1 from orders o where o.shop_id = s.id
  ))                                                              as ont_vendu,
  count(*) filter (where s.plan <> 'gratuit')                     as ont_paye
from shops s
where auth_is_admin()
group by auth_is_admin();

/* Croissance sur 12 mois : inscriptions et publications par mois. */
create or replace view admin_growth
with (security_invoker = true)
as
select
  to_char(date_trunc('month', s.created_at), 'YYYY-MM')  as mois,
  count(*)                                              as creees,
  count(*) filter (where s.published_at is not null)    as publiees,
  count(*) filter (where s.plan <> 'gratuit')           as payantes
from shops s
where s.created_at > now() - interval '12 months'
  and auth_is_admin()
group by 1
order by 1;

/* Activité commerciale sur 30 jours. */
create or replace view admin_orders_daily
with (security_invoker = true)
as
select
  to_char(date_trunc('day', o.created_at), 'YYYY-MM-DD') as jour,
  count(*)                                               as commandes,
  coalesce(sum(o.total), 0)::bigint                      as volume,
  count(*) filter (where o.status = 'livree')            as livrees,
  count(*) filter (where o.status = 'annulee')           as annulees
from orders o
where o.created_at > now() - interval '30 days'
  and auth_is_admin()
group by 1
order by 1;

/* Santé : ce qui doit alerter. */
create or replace view admin_health
with (security_invoker = true)
as
select
  /* Boutiques publiées mais sans aucune commande depuis 30 jours :
     ce sont les prochains à partir. */
  count(*) filter (
    where s.status = 'active'
      and not exists (
        select 1 from orders o
        where o.shop_id = s.id and o.created_at > now() - interval '30 days'
      )
  )                                                       as actives_sans_vente_30j,

  /* En période de grâce : impayés, à relancer maintenant. */
  count(*) filter (where s.status = 'grace')              as en_impaye,

  /* Publiées sans photo : leur boutique ne vendra pas. */
  count(*) filter (
    where s.status = 'active'
      and not exists (select 1 from product_images i where i.shop_id = s.id)
  )                                                       as publiees_sans_photo,

  /* Boutiques vides publiées : un lien partagé vers une page vide. */
  count(*) filter (
    where s.status = 'active'
      and not exists (select 1 from products p where p.shop_id = s.id)
  )                                                       as publiees_sans_produit
from shops s
where auth_is_admin()
group by auth_is_admin();

/* Palmarès : qui porte la plateforme. */
create or replace view admin_top_shops
with (security_invoker = true)
as
select
  s.id,
  s.name,
  s.slug,
  s.plan,
  count(o.id)                                            as commandes,
  coalesce(sum(o.total), 0)::bigint                      as volume,
  max(o.created_at)                                      as derniere_commande
from shops s
left join orders o
  on o.shop_id = s.id
 and o.status in ('payee', 'preparation', 'expediee', 'livree')
where auth_is_admin()
group by s.id, s.name, s.slug, s.plan
order by volume desc
limit 20;

/* Répartition par modèle : quels designs sont réellement choisis.
   Utile pour savoir lesquels développer. */
create or replace view admin_templates
with (security_invoker = true)
as
select
  s.template::text  as template,
  count(*)          as utilisations,
  count(*) filter (where s.plan <> 'gratuit') as payantes
from shops s
where auth_is_admin()
group by 1
order by 2 desc;
