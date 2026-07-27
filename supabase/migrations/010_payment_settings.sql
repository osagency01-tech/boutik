-- ============================================================
--  BOUTIK — Moyens de paiement du vendeur
--
--  Coordonnées Mobile Money affichées au client au moment de la
--  confirmation de commande (message WhatsApp automatique), et mode
--  de paiement global de la boutique — un seul réglage vendeur, pas
--  un choix client par commande (source de confusion évitée).
--
--  Aucune donnée sensible : juste un numéro et un nom de compte que
--  le vendeur communique de toute façon à l'oral. Pas de policy à
--  part, la boutique suit déjà les règles RLS existantes (le vendeur
--  gère la sienne, guard_shop_privileges ne restreint que
--  plan/status/slug).
-- ============================================================

alter table shops
  add column payment_method text check (length(payment_method) <= 40),
  add column payment_number text check (length(payment_number) <= 30),
  add column payment_account_name text check (length(payment_account_name) <= 60),
  add column payment_instructions text check (length(payment_instructions) <= 300),
  add column payment_mode text not null default 'livraison'
    check (payment_mode in ('avant', 'livraison'));

comment on column shops.payment_mode is
  'avant = paiement Mobile Money exigé avant expédition ; livraison = paiement à la livraison. Décidé par le vendeur, jamais par le client.';
