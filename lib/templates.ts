/* ------------------------------------------------------------------ *
 * Catalogue des modèles
 *
 * Fichier volontairement SANS "use client" : le sitemap (rendu côté
 * serveur) doit pouvoir lire cette liste. lib/store.tsx est un module
 * client, donc rien de serveur ne peut y puiser.
 * ------------------------------------------------------------------ */

export type TemplateId =
  | "classique" | "catalogue" | "vitrine"
  | "fashion" | "beauty" | "food"
  | "luxury" | "modern" | "artisan";

export type Tier = "Starter" | "Business" | "Premium";

export const TEMPLATE_INFO: { id: TemplateId; name: string; desc: string; tier: Tier }[] = [
  { id: "classique", name: "Classique", desc: "Bannière chaleureuse + sélection mise en avant. Le plus polyvalent.", tier: "Starter" },
  { id: "catalogue", name: "Catalogue", desc: "Tous les produits dès l'accueil, densité maximale. Idéal grands stocks.", tier: "Starter" },
  { id: "vitrine", name: "Vitrine", desc: "Grandes images, style éditorial. Idéal mode et créateurs.", tier: "Starter" },
  { id: "fashion", name: "Fashion", desc: "Look magazine : grand visuel plein cadre et nouveautés en défilé.", tier: "Business" },
  { id: "beauty", name: "Beauty", desc: "Doux et arrondi, bénéfices produits mis en avant. Cosmétiques et soins.", tier: "Business" },
  { id: "food", name: "Food", desc: "Menu par catégories, prix lisibles, commande rapide. Restauration.", tier: "Business" },
  { id: "luxury", name: "Luxury Brand", desc: "Fond sombre, lettrage espacé, beaucoup de vide. Pièces d'exception.", tier: "Premium" },
  { id: "modern", name: "Modern Store", desc: "Grille asymétrique et blocs colorés. Marques jeunes et audacieuses.", tier: "Premium" },
  { id: "artisan", name: "Artisan", desc: "Chaleureux et raconté, chaque pièce a son histoire. Fait main.", tier: "Premium" },
];

export const templateTier = (id: TemplateId): Tier =>
  TEMPLATE_INFO.find((t) => t.id === id)?.tier ?? "Starter";
