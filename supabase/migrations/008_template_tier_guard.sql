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
-- ============================================================

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
    else true
  end;
$$;

-- Remplace guard_shop_privileges (002_rls.sql) : mêmes règles plan/
-- statut/slug qu'avant, avec en plus la cohérence template <-> offre.
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

  if new.template is distinct from old.template
     and not plan_allows_tier(old.plan, template_tier(new.template)) then
    raise exception 'ce modèle fait partie d''une offre supérieure : passe à cette offre pour l''utiliser';
  end if;

  return new;
end;
$$;
