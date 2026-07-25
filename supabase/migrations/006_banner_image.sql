-- ============================================================
--  BOUTIK — Image de fond pour la bannière d'accueil
--
--  Même schéma que logo_path : un chemin dans le bucket storage
--  (shop-logos, dossier <shop_id>/banner.jpg), jamais de base64
--  en base. Colonne nullable et additive : sans risque sur les
--  boutiques existantes, aucune migration de données nécessaire.
-- ============================================================

alter table shops add column if not exists banner_image_path text;

comment on column shops.banner_image_path is
  'Chemin storage (ex. shop-logos/<shop_id>/banner.jpg). Image de fond de la bannière d''accueil, optionnelle.';

-- public_shops liste ses colonnes explicitement (003_storage_lifecycle.sql) :
-- sans ce reflet, la photo de bannière resterait invisible pour les clients
-- sur /b/<slug>, alors qu'elle s'afficherait dans l'aperçu du vendeur.
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
  s.banner_image_path,
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
