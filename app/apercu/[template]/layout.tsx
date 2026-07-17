"use client";

/* Aperçu public d'un modèle, depuis la landing.
   `demo` empêche toute requête vers la base : la boutique est injectée
   par la page. Sans ça, l'aperçu affichait la boutique d'un vrai
   vendeur — qui n'a rien demandé et dont la boutique peut être vide
   ou mal faite. */

import ShopChrome from "@/components/shop-chrome";
import { CartProvider } from "@/lib/cart";
import { StoreProvider } from "@/lib/store";

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider demo>
      <CartProvider>
        <ShopChrome>{children}</ShopChrome>
      </CartProvider>
    </StoreProvider>
  );
}
