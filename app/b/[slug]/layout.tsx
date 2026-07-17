"use client";

/* Vitrine publique : boutik-app.com/b/<slug>
   En production, <slug>.boutik-app.com réécrit vers cette route.
   Même rendu que l'aperçu vendeur, mais chargé par slug et sans
   le bandeau d'aperçu. */

import ShopChrome from "@/components/shop-chrome";
import { CartProvider } from "@/lib/cart";
import { StoreProvider } from "@/lib/store";
import { useParams } from "next/navigation";

export default function PublicShopLayout({ children }: { children: React.ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  return (
    <StoreProvider slug={slug}>
      <CartProvider>
        <ShopChrome>{children}</ShopChrome>
      </CartProvider>
    </StoreProvider>
  );
}
