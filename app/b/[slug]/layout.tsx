/* Vitrine publique : boutik-app.com/b/<slug> — lien direct, partagé
   tel quel (lib/config.ts shopUrl). Même rendu que l'aperçu vendeur,
   mais chargé par slug et sans le bandeau d'aperçu.

   Server Component : la boutique est lue côté serveur (lib/server/
   shop-data.ts, clé anonyme, mêmes policies RLS publiques que le
   client) avant l'envoi du HTML — le premier rendu contient déjà la
   bannière et les produits, au lieu d'un écran "chargement…" suivi
   d'un second rendu une fois l'effet client exécuté.

   Le client peut arriver directement sur ce lien (partagé sur
   WhatsApp) sans jamais passer par la landing : c'est là aussi qu'on
   "entre dans la boutique", donc l'écran de démarrage doit s'y jouer. */

import ShopProviders from "@/components/shop-providers";
import { fetchPublicShop } from "@/lib/server/shop-data";

export default async function PublicShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const { slug } = params;
  const data = await fetchPublicShop(slug);

  return (
    <ShopProviders
      slug={slug}
      basePath={`/b/${slug}`}
      cartKey={`boutik-cart-${slug}`}
      initialConfig={data?.config}
      initialProducts={data?.products}
      initialShopId={data?.shopId}
    >
      {children}
    </ShopProviders>
  );
}
