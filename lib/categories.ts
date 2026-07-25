/* ==================================================================== *
 *  Catégories (niches) de boutique — à la place du texte libre
 *
 *  Utilisé pour composer le "tagline" affiché ("Catégorie — Ville"),
 *  voir components/shop-niche-fields.tsx.
 * ==================================================================== */

export type ShopCategory = { value: string; label: string };

export const CATEGORIES: ShopCategory[] = [
  { value: "mode", label: "Mode & Vêtements" },
  { value: "beaute", label: "Beauté & Cosmétiques" },
  { value: "alimentation", label: "Alimentation & Épicerie" },
  { value: "restauration", label: "Restauration & Plats préparés" },
  { value: "electronique", label: "Électronique & High-tech" },
  { value: "artisanat", label: "Artisanat & Décoration" },
  { value: "bijoux", label: "Bijoux & Accessoires" },
  { value: "chaussures", label: "Chaussures & Maroquinerie" },
  { value: "maison", label: "Maison & Jardin" },
  { value: "bebe", label: "Bébé & Enfant" },
  { value: "sport", label: "Sport & Loisirs" },
  { value: "sante", label: "Santé & Bien-être" },
  { value: "services", label: "Services & Prestations" },
  { value: "autre", label: "Autre" },
];

export function getCategory(value: string): ShopCategory | undefined {
  return CATEGORIES.find((c) => c.value === value);
}
