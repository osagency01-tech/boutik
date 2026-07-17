export const fcfa = (n: number) =>
  n.toLocaleString("fr-FR").replace(/\u202f/g, " ") + " F";

export type Product = {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  category: string;
  stock: number;
  icon: string;
  /** Photo principale — conservée pour compatibilité. */
  image?: string;
  /** Photos supplémentaires. Le nombre total est plafonné par l'offre. */
  images?: string[];
  description: string;
  sizes?: string[];
  /** Couleurs disponibles, sans photo dédiée : le vendeur les liste,
      le client les voit et les choisit à la commande. */
  colors?: string[];
  featured?: boolean;
  hidden?: boolean;
};

export const SHOP = {
  name: "Kadi Store",
  tagline: "Mode, wax & artisanat — Abidjan",
  whatsapp: "2250700000000",
  about:
    "Depuis 2019, Kadi Store sélectionne des pièces en wax et des créations artisanales auprès d'ateliers d'Abidjan et de Bouaké. Chaque article est vérifié à la main avant expédition.",
  zones: [
    { zone: "Abidjan — Cocody, Plateau, Marcory", price: 1000, delay: "24 h" },
    { zone: "Abidjan — autres communes", price: 1500, delay: "24–48 h" },
    { zone: "Intérieur du pays", price: 3000, delay: "2–4 jours" },
  ],
};

export const PRODUCTS: Product[] = [
  {
    id: "robe-ama",
    name: "Robe wax « Ama »",
    price: 18500,
    oldPrice: 22000,
    category: "Mode femme",
    stock: 7,
    icon: "shirt",
    description:
      "Robe midi en wax véritable, coupe évasée, poches latérales. Cousue main dans notre atelier de Cocody. Tissu 100 % coton, certifié Vlisco.",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Bleu", "Rouge", "Vert"],
    featured: true,
  },
  {
    id: "sac-bogolan",
    name: "Sac tissé Bogolan",
    price: 12000,
    category: "Accessoires",
    stock: 12,
    icon: "bag",
    description:
      "Sac cabas en toile bogolan tissée à la main, anses en cuir tanné végétal. Doublure coton, poche zippée intérieure.",
    featured: true,
  },
  {
    id: "karite-pur",
    name: "Beurre de karité pur — 250 g",
    price: 3500,
    category: "Beauté",
    stock: 30,
    icon: "sparkles",
    description:
      "Karité brut non raffiné, pressé à froid par une coopérative de femmes de Korhogo. Visage, corps et cheveux.",
    featured: true,
  },
  {
    id: "sandales-saly",
    name: "Sandales cuir « Saly »",
    price: 9000,
    category: "Chaussures",
    stock: 5,
    icon: "footprints",
    description:
      "Sandales artisanales en cuir pleine fleur, semelle antidérapante. Fabriquées à la main, pointures 36 à 45.",
    sizes: ["37", "38", "39", "40", "41", "42"],
  },
  {
    id: "chemise-homme",
    name: "Chemise homme wax",
    price: 15000,
    category: "Mode homme",
    stock: 9,
    icon: "shirt",
    description:
      "Chemise manches courtes en wax, col classique, coupe droite. Parfaite au bureau comme en cérémonie.",
    sizes: ["M", "L", "XL", "XXL"],
    featured: true,
  },
  {
    id: "huile-baobab",
    name: "Huile de baobab — 100 ml",
    price: 4500,
    category: "Beauté",
    stock: 18,
    icon: "leaf",
    description:
      "Huile vierge de graines de baobab, riche en oméga 3-6-9. Nourrit la peau et fortifie les cheveux.",
  },
  {
    id: "boucles-laiton",
    name: "Boucles d'oreilles laiton",
    price: 6000,
    category: "Accessoires",
    stock: 0,
    icon: "gem",
    description:
      "Créoles martelées en laiton recyclé, fabriquées par un bijoutier de Treichville. Légères et hypoallergéniques.",
  },
  {
    id: "panier-rangement",
    name: "Panier de rangement tressé",
    price: 7500,
    category: "Maison",
    stock: 14,
    icon: "home",
    description:
      "Grand panier en fibres naturelles tressées, anses renforcées. Idéal linge, jouets ou plantes.",
  },
];

export const CATEGORIES = [
  "Tout",
  ...Array.from(new Set(PRODUCTS.map((p) => p.category))),
];

export type OrderStatus =
  | "Nouvelle"
  | "Paiement demandé"
  | "Payée"
  | "Préparation"
  | "Expédiée"
  | "Livrée"
  | "Annulée";

export const STATUS_FLOW: OrderStatus[] = [
  "Nouvelle",
  "Paiement demandé",
  "Payée",
  "Préparation",
  "Expédiée",
  "Livrée",
];

export const STATUS_STYLE: Record<OrderStatus, string> = {
  Nouvelle: "bg-mango-soft text-yellow-800",
  "Paiement demandé": "bg-blue-50 text-blue-700",
  Payée: "bg-primary-soft text-primary-dark",
  Préparation: "bg-violet-50 text-violet-700",
  Expédiée: "bg-cyan-50 text-cyan-700",
  Livrée: "bg-primary text-white",
  Annulée: "bg-terra-soft text-terra",
};

export type Order = {
  id: string;
  client: string;
  phone: string;
  city: string;
  items: { name: string; qty: number; price: number }[];
  status: OrderStatus;
  date: string;
};

export const ORDERS: Order[] = [
  {
    id: "BK-1042",
    client: "Aïcha Koné",
    phone: "+225 07 09 11 22 33",
    city: "Cocody",
    items: [{ name: "Robe wax « Ama » (M)", qty: 1, price: 18500 }],
    status: "Nouvelle",
    date: "Aujourd'hui, 09:14",
  },
  {
    id: "BK-1041",
    client: "Moussa Diarra",
    phone: "+225 05 44 55 66 77",
    city: "Marcory",
    items: [
      { name: "Chemise homme wax (L)", qty: 2, price: 15000 },
      { name: "Sandales « Saly » (42)", qty: 1, price: 9000 },
    ],
    status: "Paiement demandé",
    date: "Aujourd'hui, 08:02",
  },
  {
    id: "BK-1040",
    client: "Fatou Bamba",
    phone: "+225 01 22 33 44 55",
    city: "Yopougon",
    items: [{ name: "Beurre de karité 250 g", qty: 3, price: 3500 }],
    status: "Payée",
    date: "Hier, 18:37",
  },
  {
    id: "BK-1039",
    client: "Jean-Marc Kouassi",
    phone: "+225 07 88 99 00 11",
    city: "Plateau",
    items: [{ name: "Sac tissé Bogolan", qty: 1, price: 12000 }],
    status: "Expédiée",
    date: "Hier, 11:20",
  },
  {
    id: "BK-1038",
    client: "Mariam Touré",
    phone: "+225 05 12 34 56 78",
    city: "Bouaké",
    items: [
      { name: "Huile de baobab 100 ml", qty: 2, price: 4500 },
      { name: "Panier tressé", qty: 1, price: 7500 },
    ],
    status: "Livrée",
    date: "12 juil., 15:03",
  },
];

export const PLANS = [
  {
    name: "Starter",
    price: 999,
    tag: "Pour démarrer",
    highlight: false,
    features: [
      "Boutique en ligne publiée",
      "10 produits",
      "3 templates Starter",
      "Commandes WhatsApp illimitées",
      "Bons de commande PDF",
      "Notifications",
    ],
  },
  {
    name: "Business",
    price: 1999,
    tag: "Le plus choisi",
    highlight: true,
    features: [
      "Tout Starter, plus :",
      "50 produits",
      "6 templates (dont Business)",
      "Personnalisation avancée",
      "Couleurs & polices libres",
      "6 photos par produit",
    ],
  },
  {
    name: "Premium",
    price: 4999,
    tag: "Pour les marques",
    highlight: false,
    features: [
      "Tout Business, plus :",
      "Produits illimités",
      "9 templates (dont Premium)",
      "Designs exclusifs",
      "Sections réordonnables",
      "10 photos par produit",
    ],
  },
];
