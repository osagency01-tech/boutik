-- ============================================================
--  BOUTIK — Storage & cycle de vie
-- ============================================================

-- ------------------------------------------------------------
--  Buckets
--
--  Publics en lecture (une vitrine doit charger vite, sans URL signée),
--  mais l'écriture est verrouillée : un vendeur ne peut déposer un
--  fichier que dans le dossier de SA boutique.
--
--  Convention de chemin : <shop_id>/<fichier>
--  C'est ce qui permet à la policy de comparer le 1er segment.
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('shop-logos',     'shop-logos',     true, 1048576,  array['image/jpeg','image/png','image/webp']),
  ('product-images', 'product-images', true, 5242880,  array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

comment on table storage.buckets is
  'file_size_limit et allowed_mime_types appliqués par Supabase : un .php renommé .jpg est rejeté à l''upload.';

-- Lecture publique : la vitrine est publique par nature
create policy "logos : lecture publique"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'shop-logos');

create policy "photos : lecture publique"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');

-- Écriture : uniquement dans le dossier de sa propre boutique.
-- (storage.foldername(name))[1] = premier segment du chemin = shop_id
create policy "logos : dépôt par le vendeur"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'shop-logos'
    and ((storage.foldername(name))[1])::uuid in (select auth_shop_ids())
  );

create policy "logos : remplacement par le vendeur"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'shop-logos'
    and ((storage.foldername(name))[1])::uuid in (select auth_shop_ids())
  );

create policy "logos : suppression par le vendeur"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'shop-logos'
    and ((storage.foldername(name))[1])::uuid in (select auth_shop_ids())
  );

create policy "photos : dépôt par le vendeur"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and ((storage.foldername(name))[1])::uuid in (select auth_shop_ids())
  );

create policy "photos : remplacement par le vendeur"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and ((storage.foldername(name))[1])::uuid in (select auth_shop_ids())
  );

create policy "photos : suppression par le vendeur"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and ((storage.foldername(name))[1])::uuid in (select auth_shop_ids())
  );

-- ------------------------------------------------------------
--  Cycle de vie de l'abonnement (§3 du CDC)
--
--  À appeler par un cron quotidien (pg_cron ou Edge Function).
--  Ces fonctions tournent en service_role : elles doivent
--  contourner RLS, d'où security definer.
-- ------------------------------------------------------------

-- J+7 après échéance impayée : dépublication
create or replace function expire_grace_periods()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update shops
     set status      = 'suspendue',
         purge_after = now() + interval '90 days'
   where status = 'grace'
     and grace_until is not null
     and grace_until < now();
  get diagnostics n = row_count;
  return n;
end;
$$;

-- J+90 après suspension : purge des données (§3)
-- Les commandes sont anonymisées, pas supprimées : le vendeur
-- peut revenir, et on garde l'historique comptable 12 mois.
create or replace function purge_expired_shops()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update orders o
     set customer_name    = 'Client supprimé',
         customer_phone   = '',
         customer_address = null,
         customer_note    = null
    from shops s
   where o.shop_id = s.id
     and s.status = 'suspendue'
     and s.purge_after < now();

  delete from products p
   using shops s
   where p.shop_id = s.id
     and s.status = 'suspendue'
     and s.purge_after < now();

  get diagnostics n = row_count;
  return n;
end;
$$;

-- Purge RGPD des commandes anciennes (12 mois, §15)
create or replace function purge_old_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update orders
     set customer_name    = 'Client supprimé',
         customer_phone   = '',
         customer_address = null,
         customer_note    = null
   where created_at < now() - interval '12 months'
     and customer_phone <> '';
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ------------------------------------------------------------
--  Vue publique d'une boutique
--  Une seule requête pour rendre la vitrine, au lieu de 4.
--  security_invoker : la vue respecte les RLS de l'appelant.
-- ------------------------------------------------------------

create or replace view public_shops
with (security_invoker = true)
as
select
  s.id,
  s.slug,
  s.name,
  s.tagline,
  s.logo_path,
  s.logo_icon,
  s.about,
  s.palette,
  s.template,
  s.banner_badge,
  s.banner_title,
  s.banner_subtitle,
  s.cta_label,
  s.featured_eyebrow,
  s.featured_title,
  s.perks,
  s.delivery_note,
  s.whatsapp,
  s.phone,
  s.instagram,
  s.hours
from shops s
where s.status in ('active', 'grace');

comment on view public_shops is
  'Expose uniquement les champs publics : ni owner_id, ni plan, ni dates de facturation.';
