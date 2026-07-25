"use client";

/* Vraie boutique de démonstration, montrée depuis la landing (bouton
   "Voir une boutique démo") : produits et photos réels de Kadi Store,
   navigation et commande fonctionnelles, mais rien n'est persisté
   (StoreProvider ne touche jamais la base en mode `demo`). */

import ShopChrome from "@/components/shop-chrome";
import { CartProvider } from "@/lib/cart";
import { StoreProvider } from "@/lib/store";
import dynamic from "next/dynamic";

const Splash = dynamic(() => import("@/components/splash"), { ssr: false });

export default function DemoShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider demo demoTemplate="classique" basePath="/demo">
      <CartProvider storageKey="boutik-cart-demo">
        <Splash />
        <ShopChrome demo>{children}</ShopChrome>
      </CartProvider>
    </StoreProvider>
  );
}
