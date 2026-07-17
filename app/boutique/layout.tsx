"use client";

/* Aperçu de la boutique par le vendeur connecté. */

import ShopChrome from "@/components/shop-chrome";
import { CartProvider } from "@/lib/cart";
import { StoreProvider } from "@/lib/store";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <CartProvider>
        <ShopChrome preview>{children}</ShopChrome>
      </CartProvider>
    </StoreProvider>
  );
}
