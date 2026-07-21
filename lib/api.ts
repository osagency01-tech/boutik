"use client";

import type { Product } from "./data";
import {
  slugify,
  storageUrl,
  supabase,
  type DbOrder,
  type DbOrderStatus,
  type DbProduct,
  type DbMessage,
  type DbShop,
  type DbZone,
} from "./supabase";
import type { ShopConfig, Zone } from "./store";

/* ------------------------------------------------------------------ *
 * Conversions base <-> front
 * ------------------------------------------------------------------ */

export function shopToConfig(s: DbShop, zones: DbZone[]): ShopConfig {
  return {
    name: s.name,
    tagline: s.tagline ?? "",
    logo: storageUrl("shop-logos", s.logo_path),
    logoIcon: s.logo_icon,
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
    plan: (s.plan.charAt(0).toUpperCase() + s.plan.slice(1)) as ShopConfig["plan"],
    published: s.status === "active" || s.status === "grace",
  };
}

export function configToShop(c: Partial<ShopConfig>): Partial<DbShop> {
  const out: Record<string, unknown> = {};
  if (c.name !== undefined) out.name = c.name;
  if (c.tagline !== undefined) out.tagline = c.tagline;
  if (c.logoIcon !== undefined) out.logo_icon = c.logoIcon;
  if (c.palette !== undefined) out.palette = c.palette;
  if (c.template !== undefined) out.template = c.template;
  if (c.bannerBadge !== undefined) out.banner_badge = c.bannerBadge;
  if (c.bannerTitle !== undefined) out.banner_title = c.bannerTitle;
  if (c.bannerSubtitle !== undefined) out.banner_subtitle = c.bannerSubtitle;
  if (c.whatsapp !== undefined) out.whatsapp = c.whatsapp;
  if (c.phone !== undefined) out.phone = c.phone;
  if (c.instagram !== undefined) out.instagram = c.instagram;
  if (c.hours !== undefined) out.hours = c.hours;
  if (c.about !== undefined) out.about = c.about;
  if (c.ctaLabel !== undefined) out.cta_label = c.ctaLabel;
  if (c.featuredTitle !== undefined) out.featured_title = c.featuredTitle;
  if (c.featuredEyebrow !== undefined) out.featured_eyebrow = c.featuredEyebrow;
  if (c.perks !== undefined) out.perks = c.perks;
  if (c.deliveryNote !== undefined) out.delivery_note = c.deliveryNote;
  /* plan et status volontairement absents : la base les refuse
     au vendeur (guard_shop_privileges). C'est le paiement qui décide. */
  return out as Partial<DbShop>;
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

/* ------------------------------------------------------------------ *
 * Boutique
 * ------------------------------------------------------------------ */

export async function fetchMyShop(): Promise<{ shop: DbShop; zones: DbZone[] } | null> {
  const sb = supabase();
  if (!sb) return null;

  const { data: sessionData } = await sb.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) return null;

  const { data: shops, error } = await sb
    .from("shops")
    .select("*")
    .eq("owner_id", userId)
    .limit(1);
  if (error) throw error;
  if (!shops?.length) return null;

  const shop = shops[0] as DbShop;
  const { data: zones } = await sb
    .from("delivery_zones")
    .select("*")
    .eq("shop_id", shop.id)
    .order("position");

  return { shop, zones: (zones ?? []) as DbZone[] };
}

export async function fetchShopBySlug(slug: string) {
  const sb = supabase();
  if (!sb) return null;

  const { data, error } = await sb.from("public_shops").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const shop = data as DbShop;
  const { data: zones } = await sb
    .from("delivery_zones")
    .select("*")
    .eq("shop_id", shop.id)
    .order("position");

  return { shop, zones: (zones ?? []) as DbZone[] };
}

export async function updateShop(shopId: string, patch: Partial<ShopConfig>) {
  const sb = supabase();
  if (!sb) return;
  const { error } = await sb.from("shops").update(configToShop(patch)).eq("id", shopId);
  if (error) throw error;
}

export async function createShop(config: Partial<ShopConfig>, ownerId: string) {
  const sb = supabase();
  if (!sb) throw new Error("Supabase non configuré");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const { data: sessionData } = await sb.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    throw new Error("Session absente. Reconnecte-toi puis réessaie.");
  }

  const base = slugify(config.name ?? "ma-boutique") || "ma-boutique";
  let slug = base;

  for (let i = 0; i < 5; i++) {
    const res = await fetch(`${url}/rest/v1/rpc/create_my_shop`, {
      method: "POST",
      headers: {
        apikey: anon as string,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ shop_data: { ...configToShop(config), slug } }),
    });

    if (res.ok) {
      return (await res.json()) as DbShop;
    }

    const errText = await res.text();
    // slug déjà pris : on réessaie avec un suffixe
    if (errText.includes("duplicate") || errText.includes("unique") || errText.includes("23505")) {
      slug = `${base}-${Math.random().toString(36).slice(2, 5)}`;
      continue;
    }
    throw new Error(errText || "Création impossible");
  }
  throw new Error("Impossible de trouver un lien disponible");
}

export async function isSlugAvailable(slug: string) {
  const sb = supabase();
  if (!sb) return true;
  const { data } = await sb.from("shops").select("id").eq("slug", slug).maybeSingle();
  const { data: reserved } = await sb
    .from("reserved_slugs")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();
  return !data && !reserved;
}

export async function publishShop(shopId: string) {
  const sb = supabase();
  if (!sb) return;
  const { error } = await sb
    .from("shops")
    .update({ status: "active", published_at: new Date().toISOString() })
    .eq("id", shopId);
  if (error) throw error;
}
/* Récupère l'abonnement actif d'une boutique (le plus récent).
   Sert à afficher la vraie date d'expiration sur la page abonnement. */
export async function fetchActiveSubscription(shopId: string) {
  const sb = supabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from("subscriptions")
    .select("plan, status, current_period_end, amount")
    .eq("shop_id", shopId)
    .eq("status", "active")
    .order("current_period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data as {
    plan: string;
    status: string;
    current_period_end: string;
    amount: number;
  } | null;
}

/* ------------------------------------------------------------------ *
 * Zones de livraison
 * ------------------------------------------------------------------ */

export async function replaceZones(shopId: string, zones: Zone[]) {
  const sb = supabase();
  if (!sb) return;
  await sb.from("delivery_zones").delete().eq("shop_id", shopId);
  if (!zones.length) return;
  const { error } = await sb.from("delivery_zones").insert(
    zones.map((z, i) => ({
      shop_id: shopId,
      label: z.zone,
      price: z.price,
      delay: z.delay,
      position: i,
    }))
  );
  if (error) throw error;
}

/* ------------------------------------------------------------------ *
 * Produits
 * ------------------------------------------------------------------ */

export async function fetchProducts(shopId: string): Promise<Product[]> {
  const sb = supabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from("products")
    .select("*, product_images(path, position)")
    .eq("shop_id", shopId)
    .order("position");
  if (error) throw error;

  return (data ?? []).map((row: any) => {
    const img = (row.product_images ?? []).sort(
      (a: any, b: any) => a.position - b.position
    )[0];
    return dbToProduct(row as DbProduct, img?.path);
  });
}

export async function insertProduct(shopId: string, p: Omit<Product, "id">, position: number) {
  const sb = supabase();
  if (!sb) throw new Error("Supabase non configuré");

  const { data, error } = await sb
    .from("products")
    .insert({
      shop_id: shopId,
      name: p.name,
      description: p.description,
      category: p.category,
      icon: p.icon,
      price: p.price,
      old_price: p.oldPrice ?? null,
      stock: p.stock,
      sizes: p.sizes ?? [],
      featured: p.featured ?? false,
      hidden: p.hidden ?? false,
      position,
    })
    .select()
    .single();

  if (error) {
    if (error.message.includes("quota")) throw new Error("QUOTA");
    throw error;
  }
  return data as DbProduct;
}

export async function patchProduct(id: string, patch: Partial<Product>) {
  const sb = supabase();
  if (!sb) return;
  const out: Record<string, unknown> = {};
  if (patch.name !== undefined) out.name = patch.name;
  if (patch.description !== undefined) out.description = patch.description;
  if (patch.category !== undefined) out.category = patch.category;
  if (patch.icon !== undefined) out.icon = patch.icon;
  if (patch.price !== undefined) out.price = patch.price;
  if (patch.oldPrice !== undefined) out.old_price = patch.oldPrice ?? null;
  if (patch.stock !== undefined) out.stock = patch.stock;
  if (patch.sizes !== undefined) out.sizes = patch.sizes ?? [];
  if (patch.featured !== undefined) out.featured = patch.featured;
  if (patch.hidden !== undefined) out.hidden = patch.hidden;

  const { error } = await sb.from("products").update(out).eq("id", id);
  if (error) throw error;
}

export async function removeProduct(id: string) {
  const sb = supabase();
  if (!sb) return;
  const { error } = await sb.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderProducts(ids: string[]) {
  const sb = supabase();
  if (!sb) return;
  await Promise.all(
    ids.map((id, i) => sb.from("products").update({ position: i }).eq("id", id))
  );
}

/* ------------------------------------------------------------------ *
 * Images — Storage
 * ------------------------------------------------------------------ */

export async function uploadImage(
  bucket: "shop-logos" | "product-images",
  shopId: string,
  file: Blob,
  name: string
) {
  const sb = supabase();
  if (!sb) throw new Error("Supabase non configuré");

  const path = `${shopId}/${name}`;
  const { error } = await sb.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: "image/jpeg",
    /* Cache 1 an : les images produits ne changent quasi jamais. Le
       navigateur du client les garde, elles ne sont pas retéléchargées
       à chaque visite -> gros gain sur l'EGRESS Supabase. Le paramètre
       de version (?v=) dans l'URL force le rafraîchissement quand une
       photo est remplacée. */
    cacheControl: "31536000",
  });
  if (error) throw error;
  return path;
}

/* Construit l'URL publique d'une image du Storage, avec un paramètre
   de version basé sur l'instant : quand une photo est remplacée
   (même chemin), ce ?v= force le navigateur à recharger la nouvelle
   au lieu de servir l'ancienne depuis son cache long. */
export function publicImageUrl(
  bucket: "shop-logos" | "product-images",
  path: string
): string {
  const base = storageUrl(bucket, path);
  if (!base) return "";
  return `${base}?v=${Date.now()}`;
}

export async function setProductImage(shopId: string, productId: string, path: string) {
  const sb = supabase();
  if (!sb) return;
  await sb.from("product_images").delete().eq("product_id", productId);
  const { error } = await sb
    .from("product_images")
    .insert({ product_id: productId, shop_id: shopId, path, position: 0 });
  if (error) throw error;
}

/* ------------------------------------------------------------------ *
 * Commandes
 * ------------------------------------------------------------------ */

export async function fetchOrders(shopId: string): Promise<DbOrder[]> {
  const sb = supabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("orders")
    .select("*, order_items(*)")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as DbOrder[];
}

export async function updateOrderStatus(id: string, status: DbOrderStatus, reason?: string) {
  const sb = supabase();
  if (!sb) return;
  const patch: Record<string, unknown> = { status };
  if (status === "annulee") patch.cancel_reason = reason ?? "Annulée par le vendeur";
  const { error } = await sb.from("orders").update(patch).eq("id", id);
  if (error) throw error;
}

export async function createOrder(input: {
  shopId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerNote?: string;
  zoneLabel: string;
  deliveryFee: number;
  items: { productId: string; name: string; size?: string; price: number; qty: number }[];
}) {
  const sb = supabase();
  if (!sb) throw new Error("Supabase non configuré");

  const subtotal = input.items.reduce((s, i) => s + i.price * i.qty, 0);

  const { data: order, error } = await sb
    .from("orders")
    .insert({
      shop_id: input.shopId,
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      customer_address: input.customerAddress,
      customer_note: input.customerNote || null,
      zone_label: input.zoneLabel,
      delivery_fee: input.deliveryFee,
      subtotal,
      total: subtotal + input.deliveryFee,
    })
    .select()
    .single();
  if (error) throw error;

  const { error: itemsError } = await sb.from("order_items").insert(
    input.items.map((i) => ({
      order_id: order.id,
      shop_id: input.shopId,
      product_id: i.productId,
      product_name: i.name,
      size: i.size ?? null,
      unit_price: i.price,
      quantity: i.qty,
    }))
  );
  if (itemsError) throw itemsError;

  return order as DbOrder;
}

/* ------------------------------------------------------------------ *
 * Messagerie interne
 * ------------------------------------------------------------------ */

export async function fetchMessages(shopId: string): Promise<DbMessage[]> {
  const sb = supabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("messages")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as DbMessage[];
}

export async function sendMessage(input: {
  shopId: string;
  name: string;
  phone?: string;
  email?: string;
  subject?: string;
  body: string;
}) {
  const sb = supabase();
  if (!sb) throw new Error("Supabase non configuré");
  const { error } = await sb.from("messages").insert({
    shop_id: input.shopId,
    sender_name: input.name,
    sender_phone: input.phone || null,
    sender_email: input.email || null,
    subject: input.subject || null,
    body: input.body,
  });
  if (error) {
    if (error.message.includes("Trop de messages")) throw new Error("FLOOD");
    throw error;
  }
}

export async function markMessageRead(id: string) {
  const sb = supabase();
  if (!sb) return;
  const { error } = await sb
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteMessage(id: string) {
  const sb = supabase();
  if (!sb) return;
  const { error } = await sb.from("messages").delete().eq("id", id);
  if (error) throw error;
}