-- ============================================================
--  BOUTIK — Garde-fou : un modèle Business/Premium ne peut pas
--  être choisi sans l'offre qui le permet.
--
--  Ce garde-fou manquait : guard_shop_privileges (002_rls.sql)
--  bloque déjà un vendeur qui changerait son propre `plan`, mais
--  ne vérifiait jamais que `template` reste cohérent avec `plan`.
--  Rien ne l'empêchait donc d'appeler l'API directement pour
--  enregistrer un modèle payant sans jamais payer — même si
--  l'interface, elle, respecte déjà les offres.
--
--  Trigger séparé plutôt que de réécrire guard_shop_privileges :
--  ses règles plan/statut/slug restent en un seul endroit
--  (002_rls.sql), sans copie à maintenir en double entre deux
--  fichiers de migration.
-- ============================================================

-- Repli délibérément FAIL-CLOSED : un modèle ou un palier non
-- répertorié (ex. ajouté plus tard sans mettre ce fichier à jour)
-- est traité comme le plus restrictif plutôt que d'être autorisé
-- silencieusement.
create or replace function template_tier(t template_id)
returns text
language sql
immutable
as $$
  select case t
    when 'classique' then 'starter'
    when 'catalogue' then 'starter'
    when 'vitrine'   then 'starter'
    when 'fashion'   then 'business'
    when 'beauty'    then 'business'
    when 'food'      then 'business'
    when 'luxury'    then 'premium'
    when 'modern'    then 'premium'
    when 'artisan'   then 'premium'
    else 'premium'
  end;
$$;

create or replace function plan_allows_tier(p plan_tier, tier text)
returns boolean
language sql
immutable
as $$
  select case tier
    when 'starter'  then true
    when 'business' then p in ('business', 'premium')
    when 'premium'  then p = 'premium'
    else false
  end;
$$;

create or replace function guard_template_tier()
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

  if new.template is distinct from old.template
     and not plan_allows_tier(old.plan, template_tier(new.template)) then
    raise exception 'ce modèle fait partie d''une offre supérieure : passe à cette offre pour l''utiliser';
  end if;

  return new;
end;
$$;

create trigger shops_guard_template_tier
  before update of template on shops
  for each row execute function guard_template_tier();
