"use client";

import ShopChrome from "@/components/shop-chrome";
import Splash from "@/components/splash";
import { CartProvider } from "@/lib/cart";
import type { Product } from "@/lib/data";
import { StoreProvider, type ShopConfig } from "@/lib/store";

/* Wrapper client entre un Server Component (app/demo, app/b/[slug]) et
   les providers qui ont besoin du navigateur (contexte React, cart en
   localStorage, splash). Le Server Component fait la requête réseau et
   passe le résultat en props ; ici on ne fait que monter l'arbre — pas
   de logique de chargement, elle est déjà faite côté serveur. */
export default function ShopProviders({
  children,
  basePath,
  cartKey,
  demo = false,
  slug,
  initialConfig,
  initialProducts,
  initialShopId,
}: {
  children: React.ReactNode;
  basePath: string;
  cartKey: string;
  demo?: boolean;
  slug?: string;
  initialConfig?: Partial<ShopConfig>;
  initialProducts?: Product[];
  initialShopId?: string;
}) {
  return (
    <StoreProvider
      slug={slug}
      demo={demo}
      basePath={basePath}
      initialConfig={initialConfig}
      initialProducts={initialProducts}
      initialShopId={initialShopId}
    >
      <CartProvider storageKey={cartKey}>
        <Splash />
        <ShopChrome demo={demo}>{children}</ShopChrome>
      </CartProvider>
    </StoreProvider>
  );
}
