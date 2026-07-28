-- ============================================================
--  BOUTIK — Abonnements aux notifications push (Web Push)
--
--  Un vendeur qui active « Installer Boutik pour recevoir tes
--  notifications » (components/onboarding.tsx / install-prompt.tsx)
--  s'abonne au Push API du navigateur. On stocke l'abonnement ici
--  pour pouvoir lui envoyer une vraie notification quand une commande
--  arrive — jusqu'ici seule la réception (public/sw.js) existait,
--  jamais l'envoi.
-- ============================================================

create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null references shops(id) on delete cascade,
  endpoint    text not null,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now(),
  unique (shop_id, endpoint)
);

alter table push_subscriptions enable row level security;

-- Le vendeur gère les abonnements de SA boutique (un par navigateur/appareil
-- où il a accepté les notifications). Personne d'autre ne lit un endpoint :
-- l'Edge Function notify-order y accède via service_role, qui contourne RLS.
create policy "abonnements push : gérés par le vendeur"
  on push_subscriptions for all
  to authenticated
  using (shop_id in (select auth_shop_ids()))
  with check (shop_id in (select auth_shop_ids()));

-- ------------------------------------------------------------
--  Déclenchement : à chaque nouvelle commande, on appelle l'Edge
--  Function notify-order via pg_net (HTTP asynchrone : n'attend pas
--  la réponse, ne bloque jamais l'insertion de la commande même si
--  l'envoi push échoue ou traîne).
--
--  L'URL du projet et la clé service_role ne sont jamais écrites en
--  dur dans une migration versionnée : elles vivent dans Supabase
--  Vault. À faire une fois dans le SQL Editor, après avoir appliqué
--  cette migration :
--
--    select vault.create_secret('https://<ref>.supabase.co', 'project_url');
--    select vault.create_secret('<clé service_role>', 'service_role_key');
--
--  Tant que ces secrets ne sont pas posés, notify_new_order() ne fait
--  rien (pas d'erreur, pas de blocage de commande) : le site continue
--  de fonctionner normalement sans notifications.
-- ------------------------------------------------------------

create extension if not exists pg_net;

create or replace function notify_new_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text;
  v_key text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'service_role_key';

  if v_url is null or v_key is null then
    return new;
  end if;

  perform net.http_post(
    url := v_url || '/functions/v1/notify-order',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := jsonb_build_object(
      'shop_id', new.shop_id,
      'id', new.id,
      'reference', new.reference,
      'customer_name', new.customer_name
    )
  );
  return new;
end;
$$;

create trigger orders_notify_new
  after insert on orders
  for each row execute function notify_new_order();
