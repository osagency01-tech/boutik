-- ============================================================
--  BOUTIK — Messagerie interne & espace admin
--
--  Objectif : le client ne doit pas écrire au vendeur sur WhatsApp.
--  Seule la COMMANDE part sur WhatsApp. Les questions ("bonjour,
--  vous avez du 42 ?") passent par une messagerie interne, purgée
--  automatiquement pour ne pas saturer la base.
-- ============================================================

-- ------------------------------------------------------------
--  messages
--
--  Pas de compte client : on stocke ses coordonnées dans le message,
--  comme pour les commandes. Le vendeur répond hors plateforme
--  (WhatsApp/téléphone) s'il le souhaite — c'est SON choix, pas
--  celui du client.
-- ------------------------------------------------------------

create table messages (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null references shops(id) on delete cascade,

  -- Snapshot client (pas de FK : le client n'a pas de compte)
  sender_name  text not null check (length(trim(sender_name)) between 2 and 60),
  sender_phone text check (length(sender_phone) <= 20),
  sender_email text check (length(sender_email) <= 120),

  subject     text check (length(subject) <= 80),
  body        text not null check (length(trim(body)) between 2 and 1000),

  -- Cycle de vie
  read_at     timestamptz,
  -- Purge 7 jours APRÈS lecture (pas 24 h : un vendeur qui lit le matin
  -- et répond le soir perdrait le fil, et sa seule trace en cas de litige).
  purge_after timestamptz,

  created_at  timestamptz not null default now()
);

comment on table messages is
  'Messagerie interne client -> vendeur. Purgée 7 jours après lecture, 30 jours si jamais lue.';
comment on column messages.purge_after is
  'Fixé par trigger au moment de la lecture. Un message non lu est gardé 30 jours.';

create index messages_shop_idx    on messages (shop_id, created_at desc);
create index messages_unread_idx  on messages (shop_id) where read_at is null;
create index messages_purge_idx   on messages (purge_after) where purge_after is not null;

-- Un message non lu ne doit pas rester éternellement : 30 jours max.
create or replace function set_message_purge()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    new.purge_after := now() + interval '30 days';

  -- Passage de non lu à lu : la fenêtre se réduit à 7 jours.
  elsif new.read_at is not null and old.read_at is null then
    new.purge_after := now() + interval '7 days';
  end if;
  return new;
end;
$$;

create trigger messages_set_purge
  before insert or update of read_at on messages
  for each row execute function set_message_purge();

-- Purge quotidienne (à brancher sur le même cron que le reste)
create or replace function purge_old_messages()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  delete from messages where purge_after < now();
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ------------------------------------------------------------
--  RLS messages
--
--  Le visiteur ÉCRIT mais ne LIT jamais : sinon n'importe qui
--  listerait les questions (et les numéros) de tous les clients.
--  Même logique que les commandes.
-- ------------------------------------------------------------

alter table messages enable row level security;

create policy "messages : envoi public"
  on messages for insert
  to anon, authenticated
  with check (shop_is_public(shop_id));

create policy "messages : lus par le vendeur"
  on messages for select
  to authenticated
  using (shop_id in (select auth_shop_ids()) or auth_is_admin());

create policy "messages : marques lus par le vendeur"
  on messages for update
  to authenticated
  using (shop_id in (select auth_shop_ids()))
  with check (shop_id in (select auth_shop_ids()));

create policy "messages : supprimes par le vendeur"
  on messages for delete
  to authenticated
  using (shop_id in (select auth_shop_ids()));

-- Anti-spam : un visiteur ne peut pas noyer un vendeur.
-- 3 messages / heure / boutique depuis la même "identité" déclarée.
create or replace function guard_message_flood()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare recent integer;
begin
  select count(*) into recent
    from messages
   where shop_id = new.shop_id
     and coalesce(sender_phone, sender_email, '') = coalesce(new.sender_phone, new.sender_email, '')
     and created_at > now() - interval '1 hour';

  if recent >= 3 then
    raise exception 'Trop de messages envoyés. Réessaie dans une heure.';
  end if;
  return new;
end;
$$;

create trigger messages_guard_flood
  before insert on messages
  for each row execute function guard_message_flood();

-- ------------------------------------------------------------
--  Espace admin
--
--  L'admin voit TOUT : toutes les boutiques, toutes les stats.
--  Les policies ci-dessus incluent déjà `or auth_is_admin()`,
--  donc il ne reste qu'à exposer des vues agrégées.
--
--  security_invoker = true : la vue applique les droits de
--  l'appelant. Sans ça, n'importe qui lirait les stats globales.
-- ------------------------------------------------------------

create or replace view admin_stats
with (security_invoker = true)
as
select
  (select count(*) from shops)                                        as shops_total,
  (select count(*) from shops where status = 'active')                as shops_actives,
  (select count(*) from shops where status = 'brouillon')             as shops_brouillons,
  (select count(*) from shops where status = 'suspendue')             as shops_suspendues,
  (select count(*) from shops where plan = 'gratuit')                 as plan_gratuit,
  (select count(*) from shops where plan = 'starter')                 as plan_starter,
  (select count(*) from shops where plan = 'business')                as plan_business,
  (select count(*) from shops where plan = 'premium')                 as plan_premium,
  (select count(*) from profiles)                                     as vendeurs_total,
  (select count(*) from products)                                     as produits_total,
  (select count(*) from orders)                                       as commandes_total,
  (select count(*) from orders where created_at > now() - interval '30 days') as commandes_30j,
  (select coalesce(sum(total), 0) from orders where status in ('payee','preparation','expediee','livree')) as volume_total,
  (select count(*) from reports where resolved = false)               as signalements_ouverts
where auth_is_admin();

comment on view admin_stats is
  'Statistiques globales. Le WHERE auth_is_admin() renvoie 0 ligne aux non-admins.';

/* Liste des boutiques pour le back-office. */
create or replace view admin_shops
with (security_invoker = true)
as
select
  s.id,
  s.slug,
  s.name,
  s.plan,
  s.status,
  s.created_at,
  s.published_at,
  p.full_name  as owner_name,
  p.phone      as owner_phone,
  (select count(*) from products pr where pr.shop_id = s.id)  as products_count,
  (select count(*) from orders o where o.shop_id = s.id)      as orders_count,
  (select coalesce(sum(o.total), 0) from orders o
    where o.shop_id = s.id
      and o.status in ('payee','preparation','expediee','livree'))   as revenue
from shops s
join profiles p on p.id = s.owner_id
where auth_is_admin();

/* Actions d'administration : suspendre / réactiver / bannir.
   Passe par une fonction plutôt qu'un UPDATE direct pour journaliser
   systématiquement — un changement de statut de boutique doit laisser
   une trace. */
create or replace function admin_set_shop_status(
  target uuid,
  new_status shop_status,
  reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare old_status shop_status;
begin
  if not auth_is_admin() then
    raise exception 'Réservé aux administrateurs';
  end if;

  select status into old_status from shops where id = target;

  update shops
     set status = new_status,
         purge_after = case
           when new_status in ('suspendue','bannie') then now() + interval '90 days'
           else null
         end
   where id = target;

  insert into audit_log (actor_id, shop_id, action, target, metadata)
  values (
    auth.uid(), target, 'shop_status_change', new_status::text,
    jsonb_build_object('from', old_status, 'to', new_status, 'reason', reason)
  );
end;
$$;

/* Accorder / retirer le rôle admin. Seul un admin peut le faire. */
create or replace function admin_set_role(target_user uuid, make_admin boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not auth_is_admin() then
    raise exception 'Réservé aux administrateurs';
  end if;

  -- Garde-fou : ne pas se retirer soi-même le dernier accès admin
  if not make_admin
     and target_user = auth.uid()
     and (select count(*) from profiles where is_admin) <= 1 then
    raise exception 'Impossible de retirer le dernier administrateur';
  end if;

  update profiles set is_admin = make_admin where id = target_user;

  insert into audit_log (actor_id, action, target, metadata)
  values (auth.uid(), 'role_change', target_user::text,
          jsonb_build_object('is_admin', make_admin));
end;
$$;
