"use client";

import { ProductVisual } from "@/components/product-card";
import { useCart } from "@/lib/cart";
import { fcfa } from "@/lib/data";
import { useStore } from "@/lib/store";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";

export default function CartPage() {
  const { detailed, setQty, remove, total } = useCart();
  const { config, palette } = useStore();

  if (detailed.length === 0)
    return (
      <div className="flex flex-col items-center pt-24 text-center">
        <span
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: palette.accent + "1A", color: palette.accent }}
        >
          <ShoppingBag size={26} />
        </span>
        <h1 className="mt-5 font-display text-2xl font-extrabold">Ton panier est vide</h1>
        <p className="mt-2 max-w-xs text-sm shop-muted">
          Parcours la boutique et ajoute tes coups de cœur : la commande se fait
          en moins d'une minute.
        </p>
        <Link
          href="/boutique/produits"
          className="btn btn-lg mt-7 text-white hover:shadow-lift"
          style={{ backgroundColor: palette.accent }}
        >
          Voir les produits
        </Link>
      </div>
    );

  return (
    <div className="pt-8">
      <h1 className="font-display text-3xl font-extrabold">Mon panier</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr,340px] lg:items-start">
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {detailed.map((l) => (
              <motion.div
                key={l.id + (l.size ?? "") + (l.color ?? "")}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="shop-card flex items-center gap-4 p-3"
              >
                <ProductVisual
                  product={l.product}
                  className="h-20 w-20 shrink-0 rounded-xl"
                  iconSize={30}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display font-bold">{l.product.name}</p>
                  {(l.size || l.color) && (
                    <p className="text-xs text-ink/50">
                      {[l.size && `Taille ${l.size}`, l.color].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <p className="mt-0.5 text-sm font-extrabold" style={{ color: palette.accent }}>
                    {fcfa(l.product.price)}
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-full border border-ink/10 bg-cream p-1">
                  <button
                    onClick={() => setQty(l.id, l.size, l.color, l.qty - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white"
                    aria-label="Diminuer"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{l.qty}</span>
                  <button
                    onClick={() => setQty(l.id, l.size, l.color, l.qty + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white"
                    aria-label="Augmenter"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <button
                  onClick={() => remove(l.id, l.size, l.color)}
                  className="p-2 text-ink/35 transition-colors hover:text-terra"
                  aria-label="Retirer"
                >
                  <Trash2 size={17} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="shop-card sticky top-24 p-6">
          <h2 className="font-display text-lg font-extrabold">Récapitulatif</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between shop-muted">
              <span>Sous-total</span>
              <span className="font-bold text-ink">{fcfa(total)}</span>
            </div>
            <div className="flex justify-between shop-muted">
              <span>Livraison</span>
              <span>calculée à la commande</span>
            </div>
          </div>
          <div className="mt-4 flex justify-between border-t border-ink/10 pt-4">
            <span className="font-bold">Total</span>
            <span className="font-display text-xl font-extrabold" style={{ color: palette.accent }}>
              {fcfa(total)}
            </span>
          </div>
          <Link
            href="/boutique/commande"
            className="btn btn-lg mt-6 w-full text-white hover:shadow-lift"
            style={{ backgroundColor: palette.accent }}
          >
            Passer la commande <ArrowRight size={17} />
          </Link>
          <p className="mt-3 text-center text-xs text-ink/45">
            Paiement à la livraison ou par Mobile Money, directement avec le vendeur.
          </p>
        </div>
      </div>
    </div>
  );
}
