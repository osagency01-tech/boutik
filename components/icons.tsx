"use client";

import {
  Baby,
  Bike,
  Cake,
  Coffee,
  Dumbbell,
  Flower2,
  Footprints,
  Gem,
  Hammer,
  Headphones,
  Home,
  Image as ImageIcon,
  Laptop,
  Leaf,
  Package,
  Palette,
  Scissors,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Store,
  Utensils,
  Watch,
  Wine,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ *
 * Icônes de boutique — remplacent les emojis du logo.
 * Un vendeur sans logo choisit une icône ; elle rend de façon nette
 * à toute taille, contrairement à un emoji qui varie selon l'appareil.
 * ------------------------------------------------------------------ */

export type ShopIconId =
  | "store"
  | "bag"
  | "shirt"
  | "gem"
  | "sparkles"
  | "leaf"
  | "flower"
  | "utensils"
  | "cake"
  | "coffee"
  | "wine"
  | "smartphone"
  | "laptop"
  | "headphones"
  | "home"
  | "hammer"
  | "palette"
  | "scissors"
  | "footprints"
  | "watch"
  | "baby"
  | "dumbbell"
  | "bike"
  | "package";

export const SHOP_ICONS: { id: ShopIconId; label: string; Icon: LucideIcon }[] = [
  { id: "store", label: "Boutique", Icon: Store },
  { id: "bag", label: "Sacs", Icon: ShoppingBag },
  { id: "shirt", label: "Mode", Icon: Shirt },
  { id: "gem", label: "Bijoux", Icon: Gem },
  { id: "sparkles", label: "Beauté", Icon: Sparkles },
  { id: "leaf", label: "Naturel", Icon: Leaf },
  { id: "flower", label: "Fleurs", Icon: Flower2 },
  { id: "utensils", label: "Restauration", Icon: Utensils },
  { id: "cake", label: "Pâtisserie", Icon: Cake },
  { id: "coffee", label: "Café", Icon: Coffee },
  { id: "wine", label: "Boissons", Icon: Wine },
  { id: "smartphone", label: "Téléphonie", Icon: Smartphone },
  { id: "laptop", label: "Informatique", Icon: Laptop },
  { id: "headphones", label: "Audio", Icon: Headphones },
  { id: "home", label: "Maison", Icon: Home },
  { id: "hammer", label: "Artisanat", Icon: Hammer },
  { id: "palette", label: "Art", Icon: Palette },
  { id: "scissors", label: "Couture", Icon: Scissors },
  { id: "footprints", label: "Chaussures", Icon: Footprints },
  { id: "watch", label: "Montres", Icon: Watch },
  { id: "baby", label: "Enfants", Icon: Baby },
  { id: "dumbbell", label: "Sport", Icon: Dumbbell },
  { id: "bike", label: "Mobilité", Icon: Bike },
  { id: "package", label: "Divers", Icon: Package },
];

const MAP = Object.fromEntries(SHOP_ICONS.map((i) => [i.id, i.Icon])) as Record<
  ShopIconId,
  LucideIcon
>;

export const getShopIcon = (id: string): LucideIcon => MAP[id as ShopIconId] ?? Store;

/* ------------------------------------------------------------------ *
 * Logo de boutique : image importée si elle existe, sinon icône.
 * ------------------------------------------------------------------ */

export function ShopLogo({
  logo,
  icon,
  name,
  accent,
  size = 40,
  className = "",
}: {
  logo?: string;
  icon: string;
  name: string;
  accent: string;
  size?: number;
  className?: string;
}) {
  if (logo)
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={logo}
        alt={name}
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );

  const Icon = getShopIcon(icon);
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full ${className}`}
      style={{ width: size, height: size, backgroundColor: accent + "1A", color: accent }}
      aria-hidden
    >
      <Icon size={size * 0.5} strokeWidth={2} />
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Placeholder produit sans photo.
 * Motif discret + icône : lisible, jamais enfantin.
 * ------------------------------------------------------------------ */

export function ProductPlaceholder({
  icon,
  accent,
  size = 40,
}: {
  icon?: string;
  accent: string;
  size?: number;
}) {
  const Icon = icon ? getShopIcon(icon) : ImageIcon;
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ backgroundColor: accent + "0F" }}
    >
      <Icon size={size} strokeWidth={1.25} style={{ color: accent, opacity: 0.55 }} />
    </div>
  );
}
