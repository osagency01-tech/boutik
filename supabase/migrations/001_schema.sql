-- ============================================================
--  BOUTIK — Schéma initial
--
--  Principe directeur : ISOLATION MULTI-TENANT.
--  Chaque ligne métier porte un shop_id, et toute lecture/écriture
--  passe par une policy RLS. Un vendeur ne peut jamais voir les
--  données d'un autre, même si une requête applicative oublie un WHERE.
--
--  Ordre : extensions -> types -> tables -> index -> triggers
--  (RLS et fonctions : voir 002_rls.sql)
-- ============================================================

create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "pg_trgm";       -- recherche produits

-- ------------------------------------------------------------
--  Types énumérés
--  Alignés sur le front (lib/store.tsx, lib/data.ts).
-- ------------------------------------------------------------

create type plan_tier as enum ('gratuit', 'starter', 'business', 'premium');

create type shop_status as enum (
  'brouillon',    -- créée, jamais publiée
  'active',       -- publiée, abonnement à jour
  'grace',        -- impayée, encore visible (J+0 → J+7)
  'suspendue',    -- dépubliée (J+7), données conservées 90 j
  'bannie'        -- violation CGU
);

create type template_id as enum (
  'classique', 'catalogue', 'vitrine',
  'fashion', 'beauty', 'food',
  'luxury', 'modern', 'artisan'
);

create type order_status as enum (
  'nouvelle',
  'paiement_demande',
  'payee',
  'preparation',
  'expediee',
  'livree',
  'annulee'
);

create type subscription_status as enum (
  'en_attente',   -- intention créée, webhook pas encore reçu
  'active',
  'impayee',
  'annulee'
);

create type member_role as enum ('proprietaire', 'gerant');

-- ------------------------------------------------------------
--  profiles — extension de auth.users
--  Supabase gère l'auth ; on stocke ici ce qui nous appartient.
-- ------------------------------------------------------------

create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  phone         text unique,          -- format E.164, ex. +2250700000000
  phone_verified boolean not null default false,
  is_admin      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on column profiles.is_admin is
  'Back-office Anthropic/Boutik. Jamais modifiable par le client (voir policies).';

-- ------------------------------------------------------------
--  shops — le tenant
-- ------------------------------------------------------------

create table shops (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references profiles(id) on delete restrict,

  -- Identité publique
  slug          citext not null unique,
  name          text not null check (length(trim(name)) between 2 and 40),
  tagline       text check (length(tagline) <= 60),
  logo_path     text,                 -- chemin dans le bucket storage, pas une dataURL
  logo_icon     text not null default 'store',
  about         text check (length(about) <= 600),

  -- Apparence
  palette       text not null default 'marche',
  template      template_id not null default 'classique',

  -- Bannière et textes de section (tous éditables par le vendeur)
  banner_badge     text check (length(banner_badge) <= 30),
  banner_title     text check (length(banner_title) <= 70),
  banner_subtitle  text check (length(banner_subtitle) <= 200),
  cta_label        text check (length(cta_label) <= 30),
  featured_eyebrow text check (length(featured_eyebrow) <= 20),
  featured_title   text check (length(featured_title) <= 40),
  perks            text[] not null default '{}' check (array_length(perks, 1) is null or array_length(perks, 1) <= 4),
  delivery_note    text check (length(delivery_note) <= 300),

  -- Contact
  whatsapp      text check (whatsapp ~ '^[0-9]{8,15}$'),
  phone         text,
  instagram     text,
  hours         text,

  -- Cycle de vie
  plan          plan_tier not null default 'gratuit',
  status        shop_status not null default 'brouillon',
  published_at  timestamptz,
  grace_until   timestamptz,          -- fin de la période de grâce (J+7)
  purge_after   timestamptz,          -- suppression des données (J+90)

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- Le slug est immuable une fois publié (règle métier §6 du CDC) :
  -- appliqué par trigger, pas par contrainte (besoin de l'ancienne valeur).
  constraint slug_format check (
    slug ~ '^[a-z0-9]([a-z0-9-]{1,28}[a-z0-9])?$'
  )
);

comment on table shops is 'Le tenant. Tout shop_id ailleurs pointe ici.';
comment on column shops.logo_path is
  'Chemin storage (ex. shop-logos/<shop_id>/logo.jpg). Jamais de base64 en base.';

-- Slugs réservés : évite qu''un vendeur prenne www/api/admin…
create table reserved_slugs (
  slug text primary key
);

insert into reserved_slugs (slug) values
  ('www'), ('api'), ('admin'), ('app'), ('mail'), ('blog'), ('shop'),
  ('boutik'), ('support'), ('help'), ('static'), ('assets'), ('cdn'),
  ('status'), ('dev'), ('staging'), ('test'), ('demo');

-- ------------------------------------------------------------
--  shop_members — accès multi-utilisateur
--  Prévu dès maintenant : rajouter la notion d''équipe après coup
--  obligerait à réécrire toutes les policies.
-- ------------------------------------------------------------

create table shop_members (
  shop_id    uuid not null references shops(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  role       member_role not null default 'gerant',
  created_at timestamptz not null default now(),
  primary key (shop_id, user_id)
);

-- ------------------------------------------------------------
--  delivery_zones
-- ------------------------------------------------------------

create table delivery_zones (
  id         uuid primary key default gen_random_uuid(),
  shop_id    uuid not null references shops(id) on delete cascade,
  label      text not null check (length(trim(label)) > 0),
  price      integer not null check (price >= 0),   -- FCFA, entier (pas de centimes)
  delay      text,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
--  products
-- ------------------------------------------------------------

create table products (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null references shops(id) on delete cascade,

  name        text not null check (length(trim(name)) between 2 and 120),
  description text check (length(description) <= 2000),
  category    text,
  icon        text not null default 'package',

  price       integer not null check (price >= 0),
  old_price   integer check (old_price is null or old_price >= 0),

  -- stock null = non géré (le vendeur ne suit pas les quantités)
  stock       integer check (stock is null or stock >= 0),
  sizes       text[] not null default '{}',

  featured    boolean not null default false,
  hidden      boolean not null default false,
  position    integer not null default 0,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint old_price_coherent check (old_price is null or old_price > price)
);

comment on column products.stock is
  'NULL = stock non géré. 0 = épuisé. Décrémenté au passage en statut payee.';

create table product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  shop_id    uuid not null references shops(id) on delete cascade,  -- dénormalisé : RLS sans jointure
  path       text not null,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

comment on column product_images.shop_id is
  'Dénormalisé volontairement : permet une policy RLS directe, sans sous-requête sur products.';

-- ------------------------------------------------------------
--  orders
--
--  Les infos client sont copiées dans la commande (pas de FK) :
--  une commande doit rester lisible même si le client demande
--  l''effacement de son compte, et le prix ne doit pas bouger
--  si le vendeur change son tarif après coup.
-- ------------------------------------------------------------

create table orders (
  id            uuid primary key default gen_random_uuid(),
  shop_id       uuid not null references shops(id) on delete cascade,

  reference     text not null,        -- ex. BK-1042, unique par boutique

  -- Snapshot client
  customer_name    text not null check (length(trim(customer_name)) > 0),
  customer_phone   text not null,
  customer_address text,
  customer_note    text check (length(customer_note) <= 500),

  -- Snapshot livraison (le tarif du jour de la commande)
  zone_label    text,
  delivery_fee  integer not null default 0 check (delivery_fee >= 0),

  subtotal      integer not null check (subtotal >= 0),
  total         integer not null check (total >= 0),

  status        order_status not null default 'nouvelle',
  cancel_reason text,

  -- Traçabilité
  stock_applied boolean not null default false,  -- évite la double décrémentation
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (shop_id, reference),
  constraint total_coherent check (total = subtotal + delivery_fee),
  constraint annulee_motive check (status <> 'annulee' or cancel_reason is not null)
);

create table order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders(id) on delete cascade,
  shop_id      uuid not null references shops(id) on delete cascade,  -- idem : RLS directe

  -- On garde le lien pour les stats, mais on n''en dépend pas pour l''affichage
  product_id   uuid references products(id) on delete set null,

  -- Snapshot produit au moment de la commande
  product_name text not null,
  size         text,
  unit_price   integer not null check (unit_price >= 0),
  quantity     integer not null check (quantity > 0),

  created_at   timestamptz not null default now()
);

comment on table order_items is
  'product_name et unit_price sont figés : une commande passée ne change jamais, même si le produit est modifié ou supprimé.';

-- Journal des changements de statut (exigé §11 du CDC)
create table order_events (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id) on delete cascade,
  shop_id    uuid not null references shops(id) on delete cascade,
  from_status order_status,
  to_status   order_status not null,
  actor_id    uuid references profiles(id) on delete set null,
  note        text,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
--  subscriptions & payments
--  L''abonnement pilote shops.plan — jamais l''inverse.
-- ------------------------------------------------------------

create table subscriptions (
  id                uuid primary key default gen_random_uuid(),
  shop_id           uuid not null references shops(id) on delete cascade,
  plan              plan_tier not null,
  status            subscription_status not null default 'en_attente',
  amount            integer not null check (amount >= 0),
  current_period_end timestamptz,
  provider          text,             -- agrégateur : à renseigner le moment venu
  provider_ref      text,             -- id d''abonnement chez l''agrégateur
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table payments (
  id            uuid primary key default gen_random_uuid(),
  shop_id       uuid not null references shops(id) on delete cascade,
  subscription_id uuid references subscriptions(id) on delete set null,

  amount        integer not null check (amount > 0),
  currency      text not null default 'XOF',
  status        text not null default 'en_attente',

  provider      text,
  provider_ref  text,
  -- Idempotence : un webhook rejoué ne doit jamais créer un doublon
  idempotency_key text unique,

  raw_payload   jsonb,
  paid_at       timestamptz,
  created_at    timestamptz not null default now()
);

comment on column payments.idempotency_key is
  'Les agrégateurs Mobile Money rejouent les webhooks. Clé unique = protection contre le double crédit.';

-- ------------------------------------------------------------
--  Modération & audit
-- ------------------------------------------------------------

create table reports (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid references shops(id) on delete cascade,
  product_id  uuid references products(id) on delete cascade,
  reason      text not null,
  details     text,
  reporter_ip inet,
  resolved    boolean not null default false,
  resolved_by uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table audit_log (
  id         bigserial primary key,
  actor_id   uuid references profiles(id) on delete set null,
  shop_id    uuid references shops(id) on delete set null,
  action     text not null,
  target     text,
  metadata   jsonb,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
--  Index
--  Règle : tout accès vitrine doit être indexé sur shop_id.
-- ------------------------------------------------------------

create index shops_owner_idx        on shops (owner_id);
create index shops_status_idx       on shops (status) where status in ('active', 'grace');
create index shops_purge_idx        on shops (purge_after) where purge_after is not null;

create index products_shop_idx      on products (shop_id, position);
create index products_visible_idx   on products (shop_id) where hidden = false;
create index products_search_idx    on products using gin (name gin_trgm_ops);

create index product_images_product_idx on product_images (product_id, position);

create index orders_shop_created_idx on orders (shop_id, created_at desc);
create index orders_shop_status_idx  on orders (shop_id, status);
create index order_items_order_idx   on order_items (order_id);
create index order_events_order_idx  on order_events (order_id, created_at desc);

create index zones_shop_idx          on delivery_zones (shop_id, position);
create index subs_shop_idx           on subscriptions (shop_id, status);
create index payments_shop_idx       on payments (shop_id, created_at desc);
create index reports_open_idx        on reports (created_at desc) where resolved = false;

-- ------------------------------------------------------------
--  updated_at automatique
-- ------------------------------------------------------------

create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch      before update on profiles      for each row execute function touch_updated_at();
create trigger shops_touch         before update on shops         for each row execute function touch_updated_at();
create trigger products_touch      before update on products      for each row execute function touch_updated_at();
create trigger orders_touch        before update on orders        for each row execute function touch_updated_at();
create trigger subscriptions_touch before update on subscriptions for each row execute function touch_updated_at();
