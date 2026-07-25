/* ------------------------------------------------------------------ *
 * Configuration du domaine
 *
 * Centralisé ici : changer de domaine ne doit pas obliger à fouiller
 * huit fichiers. NEXT_PUBLIC_SITE_URL permet de surcharger en
 * préproduction sans toucher au code.
 * ------------------------------------------------------------------ */

export const SITE_DOMAIN = "boutik-app.com";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || `https://${SITE_DOMAIN}`;

/** Adresse publique d'une boutique : boutik-app.com/b/<slug>
    (lien direct, pas de sous-domaine — ça évite de dépendre d'un
    enregistrement DNS wildcard chez l'hébergeur). */
export const shopUrl = (slug: string) => `${SITE_URL}/b/${slug}`;
export const shopDomain = (slug: string) => `${SITE_DOMAIN}/b/${slug}`;

export const SUPPORT_EMAIL = `support@${SITE_DOMAIN}`;
