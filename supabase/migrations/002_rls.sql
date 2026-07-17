-- ============================================================
--  BOUTIK — Row-Level Security
--
--  Règle absolue : RLS activé sur TOUTES les tables métier.
--  Si une requête applicative oublie « where shop_id = … »,
--  la base refuse quand même. C'est la seule protection qui
--  ne s'oublie pas dans un refactor.
--
--  Trois publics :
--    anon           → visiteur de la boutique (lecture publique restreinte)
--    authenticated  → vendeur (uniquement SES boutiques)
--    service_role   → backend/webhooks (contourne RLS, jamais exposé au client)
-- ============================================================

-- ------------------------------------------------------------
--  Fonctions d'aide
--
--  security definer + search_path figé : sans ça, une fonction
--  appelée dans une policy peut être détournée par un search_path
--  malveillant.
-- ------------------------------------------------------------

-- Boutiques auxquelles l'utilisateur courant a accès (propriétaire ou membre)
create or replace function auth_shop_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select s.id from shops s where s.owner_id = auth.uid()
  union
  select m.shop_id from shop_members m where m.user_id = auth.uid();
$$;

-- Propriétaire uniquement (actions destructrices, changement de plan)
create or replace function auth_owns_shop(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from shops where id = target and owner_id = auth.uid()
  );
$$;

create or replace function auth_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from profiles where id = auth.uid()),
    false
  );
$$;

-- Une boutique est-elle visible du public ?
-- 'grace' reste visible : le vendeur impayé garde sa vitrine 7 jours.
create or replace function shop_is_public(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from shops
    where id = target and status in ('active', 'grace')
  );
$$;

-- ------------------------------------------------------------
--  Activation RLS partout
-- ------------------------------------------------------------

alter table profiles        enable row level security;
alter table shops           enable row level security;
alter table shop_members    enable row level security;
alter table delivery_zones  enable row level security;
alter table products        enable row level security;
alter table product_images  enable row level security;
alter table orders          enable row level security;
alter table order_items     enable row level security;
alter table order_events    enable row level security;
alter table subscriptions   enable row level security;
alter table payments        enable row level security;
alter table reports         enable row level security;
alter table audit_log       enable row level security;
alter table reserved_slugs  enable row level security;

-- Par défaut : personne. Chaque accès est ensuite ouvert explicitement.
-- (Postgres refuse tout si RLS est actif sans policy correspondante.)

-- ------------------------------------------------------------
--  profiles
-- ------------------------------------------------------------

create policy "profil : lecture de soi"
  on profiles for select
  using (id = auth.uid() or auth_is_admin());

create policy "profil : modification de soi"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- is_admin ne doit jamais être auto-attribué.
-- L'UPDATE ci-dessus le permettrait ; on le bloque par trigger.
create or replace function guard_is_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin and not auth_is_admin() then
    raise exception 'is_admin non modifiable';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_admin
  before update on profiles
  for each row execute function guard_is_admin();

-- ------------------------------------------------------------
--  shops
-- ------------------------------------------------------------

-- Le visiteur ne voit que les boutiques publiées.
-- Une boutique en brouillon ou suspendue est invisible du public.
create policy "boutique : lecture publique si publiée"
  on shops for select
  to anon, authenticated
  using (status in ('active', 'grace'));

create policy "boutique : le vendeur voit les siennes"
  on shops for select
  to authenticated
  using (id in (select auth_shop_ids()) or auth_is_admin());

create policy "boutique : création par soi"
  on shops for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "boutique : modification par le vendeur"
  on shops for update
  to authenticated
  using (id in (select auth_shop_ids()))
  with check (id in (select auth_shop_ids()));

create policy "boutique : suppression par le propriétaire"
  on shops for delete
  to authenticated
  using (auth_owns_shop(id));

-- Le vendeur ne fixe ni son plan ni son statut : c'est le paiement qui décide.
-- Sans ce garde-fou, un UPDATE direct depuis le client débloquerait Premium gratuitement.
create or replace function guard_shop_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- service_role et admin passent (webhooks de paiement, back-office)
  if auth.uid() is null or auth_is_admin() then
    return new;
  end if;

  if new.plan is distinct from old.plan then
    raise exception 'plan non modifiable : il suit l''abonnement payé';
  end if;

  if new.status is distinct from old.status then
    -- seule transition permise au vendeur : publier un brouillon
    if not (old.status = 'brouillon' and new.status = 'active') then
      raise exception 'statut non modifiable';
    end if;
  end if;

  -- Slug immuable après publication (règle §6 du CDC)
  if new.slug is distinct from old.slug and old.published_at is not null then
    raise exception 'le lien de la boutique ne peut plus changer après publication';
  end if;

  return new;
end;
$$;

create trigger shops_guard_privileges
  before update on shops
  for each row execute function guard_shop_privileges();

-- Slug réservé ou déjà pris
create or replace function guard_slug()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from reserved_slugs where slug = new.slug) then
    raise exception 'ce lien est réservé';
  end if;
  return new;
end;
$$;

create trigger shops_guard_slug
  before insert or update of slug on shops
  for each row execute function guard_slug();

-- ------------------------------------------------------------
--  shop_members
-- ------------------------------------------------------------

create policy "membres : visibles par l'équipe"
  on shop_members for select
  to authenticated
  using (shop_id in (select auth_shop_ids()) or auth_is_admin());

create policy "membres : gérés par le propriétaire"
  on shop_members for all
  to authenticated
  using (auth_owns_shop(shop_id))
  with check (auth_owns_shop(shop_id));

-- ------------------------------------------------------------
--  delivery_zones — lues par le client au moment de commander
-- ------------------------------------------------------------

create policy "zones : lecture publique si boutique publiée"
  on delivery_zones for select
  to anon, authenticated
  using (shop_is_public(shop_id));

create policy "zones : gérées par le vendeur"
  on delivery_zones for all
  to authenticated
  using (shop_id in (select auth_shop_ids()))
  with check (shop_id in (select auth_shop_ids()));

-- ------------------------------------------------------------
--  products
-- ------------------------------------------------------------

-- Le public ne voit que les produits non masqués des boutiques publiées.
-- C'est ici que « masquer un produit » devient réel : même une requête
-- directe à l'API ne le renverra pas.
create policy "produits : lecture publique"
  on products for select
  to anon, authenticated
  using (hidden = false and shop_is_public(shop_id));

create policy "produits : le vendeur voit tout, même masqué"
  on products for select
  to authenticated
  using (shop_id in (select auth_shop_ids()) or auth_is_admin());

create policy "produits : gérés par le vendeur"
  on products for all
  to authenticated
  using (shop_id in (select auth_shop_ids()))
  with check (shop_id in (select auth_shop_ids()));

-- Quota par offre, appliqué en base.
-- Le front l'affiche déjà, mais un appel API direct le contournerait.
create or replace function plan_quota(p plan_tier)
returns integer
language sql
immutable
as $$
  select case p
    when 'gratuit'  then 3
    when 'starter'  then 10
    when 'business' then 50
    when 'premium'  then 2147483647
  end;
$$;

create or replace function guard_product_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  used  integer;
  limit_ integer;
begin
  select count(*) into used from products where shop_id = new.shop_id;
  select plan_quota(plan) into limit_ from shops where id = new.shop_id;

  if used >= limit_ then
    raise exception 'quota de produits atteint pour cette offre (%)' , limit_;
  end if;
  return new;
end;
$$;

create trigger products_guard_quota
  before insert on products
  for each row execute function guard_product_quota();

-- ------------------------------------------------------------
--  product_images
-- ------------------------------------------------------------

create policy "images : lecture publique"
  on product_images for select
  to anon, authenticated
  using (shop_is_public(shop_id));

create policy "images : gérées par le vendeur"
  on product_images for all
  to authenticated
  using (shop_id in (select auth_shop_ids()))
  with check (shop_id in (select auth_shop_ids()));

-- ------------------------------------------------------------
--  orders
--
--  Point sensible : le client n'est PAS authentifié (pas de compte, §5.1).
--  Il doit pouvoir créer une commande sans jamais pouvoir en lire une.
--  Sinon, n'importe qui listerait les coordonnées de tous les clients.
-- ------------------------------------------------------------

create policy "commandes : création publique"
  on orders for insert
  to anon, authenticated
  with check (shop_is_public(shop_id));

-- Aucune policy SELECT pour anon : le client ne relit jamais une commande.
-- La confirmation est rendue côté client à partir de ce qu'il vient de saisir.

create policy "commandes : lues par le vendeur"
  on orders for select
  to authenticated
  using (shop_id in (select auth_shop_ids()) or auth_is_admin());

create policy "commandes : modifiées par le vendeur"
  on orders for update
  to authenticated
  using (shop_id in (select auth_shop_ids()))
  with check (shop_id in (select auth_shop_ids()));

create policy "items : création publique"
  on order_items for insert
  to anon, authenticated
  with check (shop_is_public(shop_id));

create policy "items : lus par le vendeur"
  on order_items for select
  to authenticated
  using (shop_id in (select auth_shop_ids()) or auth_is_admin());

create policy "événements : lus par le vendeur"
  on order_events for select
  to authenticated
  using (shop_id in (select auth_shop_ids()) or auth_is_admin());

-- Les événements sont écrits par trigger uniquement, jamais par le client.

-- ------------------------------------------------------------
--  Statuts de commande : transitions contrôlées + stock
-- ------------------------------------------------------------

-- Décrémente le stock au passage en 'payee', le rend en cas d'annulation.
-- stock_applied empêche la double application si le vendeur fait payee → annulee → payee.
create or replace function apply_order_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'payee' and not old.stock_applied then
    update products p
       set stock = greatest(0, p.stock - i.quantity)
      from order_items i
     where i.order_id = new.id
       and i.product_id = p.id
       and p.stock is not null;
    new.stock_applied := true;

  elsif new.status = 'annulee' and old.stock_applied then
    update products p
       set stock = p.stock + i.quantity
      from order_items i
     where i.order_id = new.id
       and i.product_id = p.id
       and p.stock is not null;
    new.stock_applied := false;
  end if;

  return new;
end;
$$;

create trigger orders_apply_stock
  before update of status on orders
  for each row
  when (old.status is distinct from new.status)
  execute function apply_order_stock();

-- Journalise chaque changement de statut (traçabilité §11)
create or replace function log_order_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into order_events (order_id, shop_id, from_status, to_status, actor_id)
  values (new.id, new.shop_id, old.status, new.status, auth.uid());
  return new;
end;
$$;

create trigger orders_log_event
  after update of status on orders
  for each row
  when (old.status is distinct from new.status)
  execute function log_order_event();

-- Numéro de commande : généré en base, séquentiel par boutique.
-- Le générer côté client produirait des collisions.
create or replace function set_order_reference()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  if new.reference is not null and new.reference <> '' then
    return new;
  end if;
  select count(*) + 1000 into n from orders where shop_id = new.shop_id;
  new.reference := 'BK-' || n;
  return new;
end;
$$;

create trigger orders_set_reference
  before insert on orders
  for each row execute function set_order_reference();

-- ------------------------------------------------------------
--  subscriptions & payments
--
--  Lecture seule côté vendeur. Toute écriture passe par le
--  service_role (webhook de l'agrégateur), jamais par le client.
-- ------------------------------------------------------------

create policy "abonnements : lus par le vendeur"
  on subscriptions for select
  to authenticated
  using (shop_id in (select auth_shop_ids()) or auth_is_admin());

create policy "paiements : lus par le vendeur"
  on payments for select
  to authenticated
  using (shop_id in (select auth_shop_ids()) or auth_is_admin());

-- Pas de policy INSERT/UPDATE : seul service_role écrit ici.

-- ------------------------------------------------------------
--  reports — signalement public (§15)
-- ------------------------------------------------------------

create policy "signalement : ouvert à tous"
  on reports for insert
  to anon, authenticated
  with check (true);

create policy "signalement : lu par l'admin"
  on reports for select
  to authenticated
  using (auth_is_admin());

create policy "signalement : traité par l'admin"
  on reports for update
  to authenticated
  using (auth_is_admin());

-- ------------------------------------------------------------
--  audit_log — lecture admin, écriture service_role
-- ------------------------------------------------------------

create policy "audit : lu par l'admin"
  on audit_log for select
  to authenticated
  using (auth_is_admin());

-- ------------------------------------------------------------
--  reserved_slugs — lecture publique (vérif de disponibilité)
-- ------------------------------------------------------------

create policy "slugs réservés : lecture"
  on reserved_slugs for select
  to anon, authenticated
  using (true);
