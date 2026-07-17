-- ============================================================
--  BOUTIK — Tests d'isolation
--
--  À rejouer après toute modification du schéma ou des policies.
--  Un seul FAILLE = ne pas déployer.
--
--  Usage local :
--    psql -f supabase/tests/isolation_test.sql
--
--  Ces tests utilisent auth.uid() simulé via request.jwt.claim.sub.
--  Sur Supabase, la même vérification se fait avec deux vrais JWT.
-- ============================================================

begin;

set role postgres;

-- ---------- Jeu de données ----------
insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222')
on conflict do nothing;

insert into profiles (id, full_name) values
  ('11111111-1111-1111-1111-111111111111', 'Vendeur A'),
  ('22222222-2222-2222-2222-222222222222', 'Vendeur B')
on conflict do nothing;

insert into shops (id, owner_id, slug, name, plan, status, published_at) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', '11111111-1111-1111-1111-111111111111',
   'test-a', 'Test A', 'business', 'active', now()),
  ('bbbbbbbb-0000-0000-0000-00000000000b', '22222222-2222-2222-2222-222222222222',
   'test-b', 'Test B', 'business', 'active', now())
on conflict do nothing;

insert into products (shop_id, name, price, hidden) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'Visible A', 10000, false),
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'Masque A',  10000, true);

insert into orders (shop_id, customer_name, customer_phone, subtotal, delivery_fee, total)
values ('aaaaaaaa-0000-0000-0000-00000000000a', 'Client A', '+2250700000000', 10000, 1000, 11000);

-- ---------- Utilitaire d'assertion ----------
create or replace function assert_eq(label text, got bigint, want bigint)
returns void language plpgsql as $$
begin
  if got = want then
    raise notice '  OK   % (% = %)', label, got, want;
  else
    raise exception 'ECHEC : % — obtenu %, attendu %', label, got, want;
  end if;
end $$;

-- Pour les opérations qui doivent LEVER une exception (triggers).
create or replace function assert_blocked(label text, stmt text)
returns void language plpgsql as $$
begin
  execute stmt;
  raise exception 'ECHEC : % — l''operation aurait du etre bloquee', label;
exception
  when others then
    if sqlerrm like 'ECHEC%' then raise; end if;
    raise notice '  OK   % (bloque : %)', label, left(sqlerrm, 60);
end $$;

-- Pour les opérations filtrées par RLS : elles ne lèvent PAS d'erreur,
-- elles n'affectent simplement aucune ligne. C'est le comportement normal
-- de Postgres, et c'est le piège classique quand on teste des policies :
-- « pas d'exception » ne veut pas dire « autorisé ».
create or replace function assert_no_rows(label text, stmt text)
returns void language plpgsql as $$
declare n integer;
begin
  execute stmt;
  get diagnostics n = row_count;
  if n = 0 then
    raise notice '  OK   % (0 ligne affectee)', label;
  else
    raise exception 'ECHEC : % — % ligne(s) affectee(s) !', label, n;
  end if;
end $$;

-- ============ ISOLATION ENTRE VENDEURS ============
\echo ''
\echo '== Isolation entre vendeurs =='
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select assert_eq(
  'B ne lit aucune commande de A',
  (select count(*) from orders where shop_id = 'aaaaaaaa-0000-0000-0000-00000000000a'),
  0);

select assert_eq(
  'B ne voit pas le produit masque de A',
  (select count(*) from products
    where shop_id = 'aaaaaaaa-0000-0000-0000-00000000000a' and hidden = true),
  0);

select assert_eq(
  'B voit le produit public de A (vitrine)',
  (select count(*) from products
    where shop_id = 'aaaaaaaa-0000-0000-0000-00000000000a' and hidden = false),
  1);

-- ============ ACCÈS PROPRIÉTAIRE ============
\echo ''
\echo '== Acces du proprietaire =='
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select assert_eq(
  'A lit ses commandes',
  (select count(*) from orders where shop_id = 'aaaaaaaa-0000-0000-0000-00000000000a'),
  1);

select assert_eq(
  'A voit ses produits, masques inclus',
  (select count(*) from products where shop_id = 'aaaaaaaa-0000-0000-0000-00000000000a'),
  2);

-- ============ VISITEUR ANONYME ============
\echo ''
\echo '== Visiteur anonyme =='
set role anon;
reset request.jwt.claim.sub;

select assert_eq(
  'le visiteur ne lit AUCUNE commande',
  (select count(*) from orders),
  0);

select assert_eq(
  'le visiteur ne voit aucun produit masque',
  (select count(*) from products where hidden = true),
  0);

-- ============ ÉLÉVATION DE PRIVILÈGES ============
\echo ''
\echo '== Elevation de privileges =='
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select assert_blocked(
  'un vendeur ne peut pas se donner Premium',
  $$update shops set plan = 'premium' where id = 'aaaaaaaa-0000-0000-0000-00000000000a'$$);

select assert_blocked(
  'un vendeur ne peut pas se declarer admin',
  $$update profiles set is_admin = true where id = '11111111-1111-1111-1111-111111111111'$$);

select assert_blocked(
  'le slug est immuable apres publication',
  $$update shops set slug = 'autre-slug' where id = 'aaaaaaaa-0000-0000-0000-00000000000a'$$);

select assert_no_rows(
  'un vendeur ne peut pas modifier la boutique d''un autre',
  $$update shops set name = 'Pirate' where id = 'bbbbbbbb-0000-0000-0000-00000000000b'$$);

select assert_no_rows(
  'un vendeur ne peut pas supprimer les produits d''un autre',
  $$delete from products where shop_id = 'bbbbbbbb-0000-0000-0000-00000000000b'$$);

select assert_no_rows(
  'un vendeur ne peut pas modifier les commandes d''un autre',
  $$update orders set status = 'livree' where shop_id = 'bbbbbbbb-0000-0000-0000-00000000000b'$$);

-- ============ RÈGLES MÉTIER ============
\echo ''
\echo '== Regles metier =='
set role postgres;
reset request.jwt.claim.sub;

select assert_blocked(
  'un slug reserve est refuse',
  $$insert into shops (owner_id, slug, name)
    values ('11111111-1111-1111-1111-111111111111', 'admin', 'Pirate')$$);

-- Stock : décrémenté à 'payee', rendu à 'annulee'
insert into products (id, shop_id, name, price, stock)
values ('cccccccc-0000-0000-0000-00000000000c', 'bbbbbbbb-0000-0000-0000-00000000000b',
        'Stock test', 5000, 10);
insert into orders (id, shop_id, customer_name, customer_phone, subtotal, delivery_fee, total)
values ('dddddddd-0000-0000-0000-00000000000d', 'bbbbbbbb-0000-0000-0000-00000000000b',
        'Client', '+225', 5000, 0, 5000);
insert into order_items (order_id, shop_id, product_id, product_name, unit_price, quantity)
values ('dddddddd-0000-0000-0000-00000000000d', 'bbbbbbbb-0000-0000-0000-00000000000b',
        'cccccccc-0000-0000-0000-00000000000c', 'Stock test', 5000, 3);

update orders set status = 'payee' where id = 'dddddddd-0000-0000-0000-00000000000d';
select assert_eq('stock decremente au paiement',
  (select stock from products where id = 'cccccccc-0000-0000-0000-00000000000c'), 7);

update orders set status = 'annulee', cancel_reason = 'test'
 where id = 'dddddddd-0000-0000-0000-00000000000d';
select assert_eq('stock rendu a l''annulation',
  (select stock from products where id = 'cccccccc-0000-0000-0000-00000000000c'), 10);

select assert_eq('chaque changement de statut est journalise',
  (select count(*) from order_events where order_id = 'dddddddd-0000-0000-0000-00000000000d'), 2);

-- Quota : passer B en gratuit (3) alors qu'il a des produits
update shops set plan = 'gratuit' where id = 'bbbbbbbb-0000-0000-0000-00000000000b';
insert into products (shop_id, name, price)
values ('bbbbbbbb-0000-0000-0000-00000000000b', 'P2', 100),
       ('bbbbbbbb-0000-0000-0000-00000000000b', 'P3', 100);

select assert_blocked(
  'le quota de l''offre est applique en base',
  $$insert into products (shop_id, name, price)
    values ('bbbbbbbb-0000-0000-0000-00000000000b', 'De trop', 100)$$);

-- ============ COUVERTURE RLS ============
\echo ''
\echo '== Couverture RLS =='
select assert_eq(
  'aucune table publique sans RLS',
  (select count(*) from pg_tables t
    where t.schemaname = 'public'
      and not exists (
        select 1 from pg_class c
        join pg_namespace ns on ns.oid = c.relnamespace
        where c.relname = t.tablename
          and ns.nspname = 'public'
          and c.relrowsecurity)),
  0);

\echo ''
\echo '===== TOUS LES TESTS SONT PASSES ====='

rollback;
