import type { TemplateId } from "./templates";

/* ------------------------------------------------------------------ *
 * Boutiques de démonstration
 *
 * Un carré de couleur ne vend rien. Un visiteur doit voir une VRAIE
 * boutique — avec de vrais produits, de vrais prix, un vrai nom —
 * pour se projeter. C'est ce qui déclenche l'inscription.
 *
 * Chaque modèle a sa boutique, son métier et sa palette : montrer
 * neuf fois la même boutique en neuf couleurs ne prouverait rien.
 * ------------------------------------------------------------------ */

export type DemoProduct = {
  name: string;
  price: number;
  oldPrice?: number;
  category: string;
  icon: string;
  desc: string;
};

/* Visuel d'un produit de démo. Les fichiers sont générés aux couleurs
   de chaque boutique (public/demo/). Une boutique sans photos donne
   l'impression d'être vide — c'est exactement ce qu'on ne veut pas
   montrer à un vendeur qu'on essaie de convaincre. */
export const demoImage = (template: string, index: number) =>
  `/demo/${template}-${index % 6}.jpg`;

export type DemoShop = {
  template: TemplateId;
  name: string;
  tagline: string;
  logoIcon: string;
  palette: string;
  badge: string;
  title: string;
  subtitle: string;
  cta: string;
  perks: string[];
  about: string;
  products: DemoProduct[];
};

export const DEMO_SHOPS: Record<TemplateId, DemoShop> = {
  /* ---------- STARTER ---------- */
  classique: {
    template: "classique",
    name: "Kadi Store",
    tagline: "Mode, wax & artisanat — Abidjan",
    logoIcon: "shirt",
    palette: "terracotta",
    badge: "Nouvelle collection",
    title: "Le wax qui fait tourner les têtes.",
    subtitle:
      "Pièces cousues main à Abidjan, karité et huiles de nos coopératives. Livraison partout en Côte d'Ivoire.",
    cta: "Découvrir la boutique",
    perks: ["Livraison 24 h à Abidjan", "Articles vérifiés à la main", "Réponse en 1 h"],
    about:
      "Depuis 2019, Kadi Store sélectionne des pièces en wax et des créations artisanales auprès d'ateliers d'Abidjan et de Bouaké.",
    products: [
      { name: "Robe wax « Ama »", price: 18500, oldPrice: 22000, category: "Mode femme", icon: "shirt", desc: "Robe midi en wax véritable, coupe évasée, poches latérales." },
      { name: "Sac tissé Bogolan", price: 12000, category: "Accessoires", icon: "bag", desc: "Cabas en toile bogolan tissée main, anses en cuir." },
      { name: "Beurre de karité 250 g", price: 3500, category: "Beauté", icon: "sparkles", desc: "Karité brut non raffiné, pressé à froid à Korhogo." },
      { name: "Chemise homme wax", price: 15000, category: "Mode homme", icon: "shirt", desc: "Manches courtes, col classique, coupe droite." },
      { name: "Sandales cuir « Saly »", price: 9000, category: "Chaussures", icon: "footprints", desc: "Cuir pleine fleur, semelle antidérapante." },
      { name: "Boucles laiton", price: 6000, category: "Accessoires", icon: "gem", desc: "Créoles martelées en laiton recyclé." },
    ],
  },

  catalogue: {
    template: "catalogue",
    name: "Mama Épicerie",
    tagline: "Produits du terroir — Yopougon",
    logoIcon: "package",
    palette: "savane",
    badge: "Arrivage du jour",
    title: "Tout pour la cuisine ivoirienne.",
    subtitle: "Épices, céréales, huiles. Prix marché, livraison quartier.",
    cta: "Voir tout le stock",
    perks: ["Livraison sous 2 h", "Prix marché garantis", "Produits frais"],
    about: "L'épicerie de quartier, en ligne. Plus de 200 références disponibles.",
    products: [
      { name: "Riz parfumé 5 kg", price: 4500, category: "Céréales", icon: "package", desc: "Riz long grain parfumé." },
      { name: "Huile de palme 1 L", price: 1800, category: "Huiles", icon: "package", desc: "Huile rouge artisanale." },
      { name: "Attiéké frais 1 kg", price: 1000, category: "Frais", icon: "utensils", desc: "Attiéké du jour." },
      { name: "Piment séché 200 g", price: 800, category: "Épices", icon: "leaf", desc: "Piment fort moulu." },
      { name: "Gingembre frais 500 g", price: 1200, category: "Épices", icon: "leaf", desc: "Racine fraîche." },
      { name: "Arachides grillées 1 kg", price: 2500, category: "Céréales", icon: "package", desc: "Grillées à sec." },
      { name: "Poisson fumé", price: 3500, category: "Frais", icon: "utensils", desc: "Fumé au bois." },
      { name: "Tomate concentrée", price: 600, category: "Épicerie", icon: "package", desc: "Boîte 400 g." },
      { name: "Cube maggi ×50", price: 1500, category: "Épicerie", icon: "package", desc: "Boîte familiale." },
      { name: "Farine de manioc 2 kg", price: 2000, category: "Céréales", icon: "package", desc: "Gari fin." },
    ],
  },

  vitrine: {
    template: "vitrine",
    name: "Atelier Nima",
    tagline: "Céramique contemporaine — Grand-Bassam",
    logoIcon: "palette",
    palette: "argile",
    badge: "Pièces uniques",
    title: "La terre, le feu, la main.",
    subtitle: "Chaque pièce est tournée et émaillée à l'atelier. Aucune n'est identique.",
    cta: "Voir les pièces",
    perks: ["Pièces uniques", "Emballage protégé", "Expédition monde"],
    about: "Atelier fondé en 2021 à Grand-Bassam. Grès et porcelaine, cuisson au bois.",
    products: [
      { name: "Vase « Lagune »", price: 45000, category: "Vases", icon: "flower", desc: "Grès émaillé, tourné main, 32 cm." },
      { name: "Service à thé 4 pièces", price: 38000, category: "Table", icon: "coffee", desc: "Porcelaine, émail céladon." },
      { name: "Bol « Sable » ×2", price: 16000, category: "Table", icon: "utensils", desc: "Grès brut, intérieur émaillé." },
      { name: "Photophore ajouré", price: 12000, category: "Déco", icon: "home", desc: "Terre cuite ajourée main." },
      { name: "Assiette plate", price: 9000, category: "Table", icon: "utensils", desc: "Grès, 26 cm." },
    ],
  },

  /* ---------- BUSINESS ---------- */
  fashion: {
    template: "fashion",
    name: "SAPE & CO",
    tagline: "Streetwear africain — Abidjan",
    logoIcon: "shirt",
    palette: "encre",
    badge: "Drop 03",
    title: "Le style se porte, il ne s'explique pas.",
    subtitle: "Pièces limitées, sérigraphie locale. Jamais de restock.",
    cta: "Voir le drop",
    perks: ["Séries limitées", "Sérigraphie locale", "Livraison 48 h"],
    about: "Marque née à Treichville en 2022. Chaque drop est produit à 80 exemplaires.",
    products: [
      { name: "Hoodie « Djolof »", price: 28000, category: "Hauts", icon: "shirt", desc: "Molleton lourd 400 g, sérigraphie dos." },
      { name: "Tee « Wax Code »", price: 12000, category: "Hauts", icon: "shirt", desc: "Coton bio 220 g, coupe boxy." },
      { name: "Cargo « Bassam »", price: 32000, category: "Bas", icon: "shirt", desc: "Toile épaisse, 6 poches." },
      { name: "Casquette brodée", price: 9500, category: "Accessoires", icon: "shirt", desc: "Broderie 3D, snapback." },
      { name: "Sneakers « Plateau »", price: 45000, category: "Chaussures", icon: "footprints", desc: "Cuir et toile, semelle gomme." },
      { name: "Tote bag sérigraphié", price: 7000, category: "Accessoires", icon: "bag", desc: "Coton 340 g." },
    ],
  },

  beauty: {
    template: "beauty",
    name: "Baobab Soins",
    tagline: "Cosmétiques naturels — Dakar",
    logoIcon: "sparkles",
    palette: "rose-poudre",
    badge: "100 % naturel",
    title: "Ta peau mérite ce qui pousse ici.",
    subtitle: "Karité, baobab, moringa. Formules courtes, ingrédients locaux.",
    cta: "Découvrir les soins",
    perks: ["Sans parabène", "Coopératives locales", "Testé dermatologiquement"],
    about:
      "Baobab Soins travaille avec trois coopératives de femmes au Sénégal et au Mali. Chaque formule compte moins de huit ingrédients.",
    products: [
      { name: "Huile de baobab 100 ml", price: 8500, category: "Visage", icon: "leaf", desc: "Riche en oméga 3-6-9. Nourrit et répare." },
      { name: "Beurre de karité brut", price: 4500, category: "Corps", icon: "sparkles", desc: "Non raffiné, pressé à froid." },
      { name: "Sérum moringa", price: 12000, oldPrice: 15000, category: "Visage", icon: "leaf", desc: "Antioxydant, éclat immédiat." },
      { name: "Savon noir africain", price: 3000, category: "Corps", icon: "sparkles", desc: "Cendres de cacao et plantain." },
      { name: "Masque argile & miel", price: 6500, category: "Visage", icon: "flower", desc: "Purifie sans dessécher." },
    ],
  },

  food: {
    template: "food",
    name: "Chez Tantie",
    tagline: "Cuisine maison — Cocody",
    logoIcon: "utensils",
    palette: "mandarine",
    badge: "Ouvert 11 h – 22 h",
    title: "Le vrai goût de la maison.",
    subtitle: "Plats préparés le jour même. Commande avant 11 h pour le déjeuner.",
    cta: "Voir le menu",
    perks: ["Préparé le jour même", "Livraison 30 min", "Plats généreux"],
    about: "Tantie cuisine depuis 30 ans. Le menu change selon le marché.",
    products: [
      { name: "Attiéké poisson braisé", price: 3500, category: "Plats", icon: "utensils", desc: "Poisson entier, attiéké, tomate oignon." },
      { name: "Poulet DG", price: 5000, category: "Plats", icon: "utensils", desc: "Poulet, plantain, légumes sautés." },
      { name: "Garba", price: 1500, category: "Plats", icon: "utensils", desc: "Thon frit et semoule de manioc." },
      { name: "Sauce graine + riz", price: 3000, category: "Plats", icon: "utensils", desc: "Sauce graine traditionnelle." },
      { name: "Alloco", price: 1000, category: "Accompagnements", icon: "utensils", desc: "Banane plantain frite." },
      { name: "Jus de bissap 1 L", price: 1500, category: "Boissons", icon: "wine", desc: "Hibiscus frais, peu sucré." },
      { name: "Jus de gingembre", price: 1500, category: "Boissons", icon: "wine", desc: "Fait maison, bien relevé." },
      { name: "Dégué", price: 1000, category: "Desserts", icon: "cake", desc: "Mil et lait caillé." },
    ],
  },

  /* ---------- PREMIUM ---------- */
  luxury: {
    template: "luxury",
    name: "MAISON ADJO",
    tagline: "Haute joaillerie — Abidjan",
    logoIcon: "gem",
    palette: "or-noir",
    badge: "Collection privée",
    title: "L'or ne se porte pas. Il se transmet.",
    subtitle: "Pièces façonnées à la main. Or 18 carats, certificat d'authenticité.",
    cta: "Prendre rendez-vous",
    perks: ["Or 18 carats certifié", "Sur rendez-vous", "Écrin offert"],
    about:
      "Maison fondée en 1994. Trois générations d'orfèvres. Chaque pièce est numérotée et accompagnée de son certificat.",
    products: [
      { name: "Collier « Héritage »", price: 1250000, category: "Colliers", icon: "gem", desc: "Or 18 carats, maille royale, 45 cm." },
      { name: "Bracelet jonc martelé", price: 680000, category: "Bracelets", icon: "gem", desc: "Or jaune, finition martelée main." },
      { name: "Bague solitaire", price: 2400000, category: "Bagues", icon: "gem", desc: "Diamant 0,8 ct, monture or blanc." },
      { name: "Boucles « Akan »", price: 450000, category: "Boucles", icon: "gem", desc: "Motif akan, or 18 carats." },
    ],
  },

  modern: {
    template: "modern",
    name: "PIXEL",
    tagline: "Tech & audio — Plateau",
    logoIcon: "smartphone",
    palette: "indigo",
    badge: "Nouveautés",
    title: "La tech, sans le blabla.",
    subtitle: "Produits testés, garantie 12 mois, SAV sur place.",
    cta: "Voir le catalogue",
    perks: ["Garantie 12 mois", "SAV au Plateau", "Paiement à la livraison"],
    about: "Boutique tech indépendante depuis 2020. On teste tout ce qu'on vend.",
    products: [
      { name: "Casque sans fil ANC", price: 65000, oldPrice: 79000, category: "Audio", icon: "headphones", desc: "Réduction de bruit active, 30 h." },
      { name: "Écouteurs sport", price: 28000, category: "Audio", icon: "headphones", desc: "Étanches IPX7, 8 h d'autonomie." },
      { name: "Batterie 20 000 mAh", price: 18000, category: "Accessoires", icon: "smartphone", desc: "Charge rapide 22,5 W." },
      { name: "Enceinte portable", price: 42000, category: "Audio", icon: "headphones", desc: "Bluetooth 5.3, 24 h." },
      { name: "Chargeur GaN 65 W", price: 22000, category: "Accessoires", icon: "smartphone", desc: "3 ports, compact." },
      { name: "Montre connectée", price: 55000, category: "Objets", icon: "watch", desc: "GPS, cardio, 10 jours." },
    ],
  },

  artisan: {
    template: "artisan",
    name: "Bois & Racines",
    tagline: "Mobilier fait main — Bouaké",
    logoIcon: "hammer",
    palette: "cuivre",
    badge: "Fait main",
    title: "Chaque pièce a mis trois semaines à naître.",
    subtitle: "Bois massif local, assemblages traditionnels, aucune vis apparente.",
    cta: "Voir l'atelier",
    perks: ["Bois local massif", "Fait sur commande", "Livraison montée"],
    about:
      "Notre atelier travaille l'iroko et le teck depuis 2015. Cinq artisans, aucune machine à commande numérique.",
    products: [
      { name: "Tabouret « Senoufo »", price: 35000, category: "Assises", icon: "home", desc: "Iroko massif sculpté dans une seule pièce. Trois semaines de travail." },
      { name: "Table basse ronde", price: 120000, category: "Tables", icon: "home", desc: "Teck massif, piètement croisé, finition huile." },
      { name: "Étagère murale", price: 48000, category: "Rangement", icon: "home", desc: "Iroko, fixations invisibles, 90 cm." },
      { name: "Planche à découper", price: 15000, category: "Cuisine", icon: "utensils", desc: "Bout de fil, huile alimentaire." },
    ],
  },
};

export const getDemoShop = (t: TemplateId): DemoShop => DEMO_SHOPS[t] ?? DEMO_SHOPS.classique;
