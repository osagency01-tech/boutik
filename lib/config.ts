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

/** Adresse publique d'une boutique : <slug>.boutik-app.com */
export const shopUrl = (slug: string) => `https://${slug}.${SITE_DOMAIN}`;
export const shopDomain = (slug: string) => `${slug}.${SITE_DOMAIN}`;

export const SUPPORT_EMAIL = `support@${SITE_DOMAIN}`;
