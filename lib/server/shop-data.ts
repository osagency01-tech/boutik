import { createClient } from "@supabase/supabase-js";
import type { Product } from "@/lib/data";
import { dbToProduct, shopToConfig } from "@/lib/shop-transform";
import type { ShopConfig } from "@/lib/store";
import type { DbProduct, DbShop, DbZone } from "@/lib/supabase";

/* ------------------------------------------------------------------ *
 * Lecture serveur d'une boutique publique — Server Components
 * uniquement (app/b/[slug]/layout.tsx, app/demo n'en a pas besoin :
 * ses données sont statiques, voir lib/demo-shops.ts).
 *
 * Clé anonyme, comme le client : les policies RLS publiques
 * ("lecture publique si publiée") s'appliquent exactement pareil ici.
 * Pas de session à conserver côté serveur, donc pas de persistSession —
 * chaque requête recrée un client léger.
 *
 * Volontairement limité à /b/[slug] : /boutique (aperçu du vendeur
 * connecté) a besoin de la session utilisateur, ce qui demanderait
 * @supabase/ssr et la gestion des cookies d'auth — un chantier à part.
 * ------------------------------------------------------------------ */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function publicClient() {
  if (!URL || !KEY) return null;
  return createClient(URL, KEY, { auth: { persistSession: false } });
}

export async function fetchPublicShop(
  slug: string
): Promise<{ shopId: string; config: ShopConfig; products: Product[] } | null> {
  const sb = publicClient();
  if (!sb) return null;

  const { data: shop, error } = await sb
    .from("public_shops")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !shop) return null;

  const [{ data: zones }, { data: products }] = await Promise.all([
    sb.from("delivery_zones").select("*").eq("shop_id", shop.id).order("position"),
    sb
      .from("products")
      .select("*, product_images(path, position)")
      .eq("shop_id", shop.id)
      .order("position"),
  ]);

  const config = shopToConfig(shop as DbShop, (zones ?? []) as DbZone[]);
  const list = (products ?? []).map((row) => {
    const img = (row.product_images ?? []).sort(
      (a: { position: number }, b: { position: number }) => a.position - b.position
    )[0];
    return dbToProduct(row as DbProduct, img?.path);
  });

  return { shopId: shop.id as string, config, products: list };
}
