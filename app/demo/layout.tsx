/* Vraie boutique de démonstration, montrée depuis la landing (bouton
   "Voir une boutique démo") : produits et photos réels de Kadi Store,
   navigation et commande fonctionnelles, mais rien n'est persisté
   (StoreProvider ne touche jamais la base en mode `demo`).

   Server Component : demoShopToConfig/demoShopToProducts sont pures
   (lib/demo-shops.ts), donc le HTML envoyé au navigateur contient déjà
   la boutique — pas d'écran "chargement…" avant le vrai contenu. */

import ShopProviders from "@/components/shop-providers";
import { demoShopToConfig, demoShopToProducts } from "@/lib/demo-shops";

export default function DemoShopLayout({ children }: { children: React.ReactNode }) {
  const config = demoShopToConfig("classique");
  const products = demoShopToProducts("classique");

  return (
    <ShopProviders
      basePath="/demo"
      cartKey="boutik-cart-demo"
      demo
      initialConfig={config}
      initialProducts={products}
    >
      {children}
    </ShopProviders>
  );
}
