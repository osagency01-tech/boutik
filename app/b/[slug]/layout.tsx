"use client";

/* Vitrine publique : boutik-app.com/b/<slug>
   En production, <slug>.boutik-app.com réécrit vers cette route.
   Même rendu que l'aperçu vendeur, mais chargé par slug et sans
   le bandeau d'aperçu. */

import ShopChrome from "@/components/shop-chrome";
import { CartProvider } from "@/lib/cart";
import { StoreProvider } from "@/lib/store";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";

/* Le client peut arriver directement sur ce lien (partagé sur WhatsApp) sans
   jamais passer par la landing : c'est là aussi qu'on "entre dans la
   boutique", donc l'écran de démarrage doit s'y jouer. */
const Splash = dynamic(() => import("@/components/splash"), { ssr: false });

export default function PublicShopLayout({ children }: { children: React.ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  return (
    <StoreProvider slug={slug} basePath={`/b/${slug}`}>
      <CartProvider storageKey={`boutik-cart-${slug}`}>
        <Splash />
        <ShopChrome>{children}</ShopChrome>
      </CartProvider>
    </StoreProvider>
  );
}
