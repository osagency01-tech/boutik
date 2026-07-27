"use client";

/* Aperçu public d'un modèle, depuis la landing.
   `demo` empêche toute requête vers la base : la boutique est injectée
   par la page. Sans ça, l'aperçu affichait la boutique d'un vrai
   vendeur — qui n'a rien demandé et dont la boutique peut être vide
   ou mal faite. */

import ShopChrome from "@/components/shop-chrome";
import { CartProvider } from "@/lib/cart";
import { demoShopToConfig, demoShopToProducts } from "@/lib/demo-shops";
import { StoreProvider, TEMPLATE_INFO, type TemplateId } from "@/lib/store";

/* `basePath` propre à CE modèle : sans lui, les liens produits/panier/
   commande générés par les pages partagées (app/boutique/*) retombaient
   sur le préfixe par défaut ("/boutique"), qui est une route À PART —
   celle de la vraie boutique du vendeur connecté. Cliquer un produit ici
   ouvrait donc la fiche produit du compte réellement connecté au lieu de
   rester dans l'aperçu de démonstration.

   `initialConfig`/`initialProducts` (calculés ici, à partir du modèle
   dans l'URL) : sans eux, seul le useEffect de la page racine
   (app/apercu/[template]/page.tsx) injectait la boutique de démo — donc
   seulement APRÈS un premier passage par cette page racine. Un lien
   direct vers une page produit (partagé, ou après un rechargement)
   arrivait avec un store vierge et un "Produit introuvable". */
export default function PreviewLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { template: string };
}) {
  const templateId = (
    TEMPLATE_INFO.some((t) => t.id === params.template) ? params.template : "classique"
  ) as TemplateId;

  return (
    <StoreProvider
      demo
      basePath={`/apercu/${params.template}`}
      initialConfig={demoShopToConfig(templateId)}
      initialProducts={demoShopToProducts(templateId)}
    >
      <CartProvider storageKey={`boutik-cart-apercu-${params.template}`}>
        <ShopChrome demo>{children}</ShopChrome>
      </CartProvider>
    </StoreProvider>
  );
}
