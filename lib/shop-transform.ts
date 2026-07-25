import type { Product } from "./data";
import { storageUrl } from "./storage-url";
import type { DbProduct, DbShop, DbZone } from "./supabase";
import type { ShopConfig } from "./store";

/* ------------------------------------------------------------------ *
 * Conversions base <-> front — pures, sans appel réseau.
 *
 * Extraites de lib/api.ts (qui est "use client") pour être appelables
 * depuis du code serveur : lib/server/shop-data.ts les réutilise pour
 * rendre /demo et /b/[slug] côté serveur (voir StoreProvider,
 * initialConfig/initialProducts).
 * ------------------------------------------------------------------ */

export function shopToConfig(s: DbShop, zones: DbZone[]): ShopConfig {
  return {
    name: s.name,
    tagline: s.tagline ?? "",
    logo: storageUrl("shop-logos", s.logo_path),
    logoIcon: s.logo_icon,
    bannerImage: storageUrl("shop-logos", s.banner_image_path),
    palette: s.palette,
    template: s.template as ShopConfig["template"],
    bannerBadge: s.banner_badge ?? "",
    bannerTitle: s.banner_title ?? "",
    bannerSubtitle: s.banner_subtitle ?? "",
    whatsapp: s.whatsapp ?? "",
    phone: s.phone ?? "",
    instagram: s.instagram ?? "",
    hours: s.hours ?? "",
    about: s.about ?? "",
    zones: zones.map((z) => ({ zone: z.label, price: z.price, delay: z.delay ?? "" })),
    ctaLabel: s.cta_label ?? "Découvrir la boutique",
    featuredTitle: s.featured_title ?? "Nos produits",
    featuredEyebrow: s.featured_eyebrow ?? "Sélection",
    perks: s.perks ?? [],
    deliveryNote: s.delivery_note ?? "",
    /* `public_shops` (vue lue pour toute boutique publique) n'expose ni
       `plan` ni `status` — volontairement, ce sont des infos de facturation
       (voir son commentaire en base). Sans ce repli, un visiteur sur
       /b/<slug> faisait planter shopToConfig sur `undefined.charAt`. */
    plan: s.plan
      ? ((s.plan.charAt(0).toUpperCase() + s.plan.slice(1)) as ShopConfig["plan"])
      : "Business",
    published: s.status ? s.status === "active" || s.status === "grace" : true,
  };
}

export function dbToProduct(p: DbProduct, imagePath?: string | null): Product {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    oldPrice: p.old_price ?? undefined,
    category: p.category ?? "Divers",
    stock: p.stock ?? 0,
    icon: p.icon,
    image: storageUrl("product-images", imagePath),
    description: p.description ?? "",
    sizes: p.sizes?.length ? p.sizes : undefined,
    featured: p.featured,
    hidden: p.hidden,
  };
}
