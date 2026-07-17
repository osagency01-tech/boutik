"use client";

import { ProductVisual } from "@/components/product-card";
import { useCart } from "@/lib/cart";
import { fcfa } from "@/lib/data";
import { useStore } from "@/lib/store";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Minus, Plus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { config, products, ready, palette } = useStore();
  const product = products.find((p) => p.id === id);
  const { add } = useCart();
  const router = useRouter();
  const [size, setSize] = useState<string | undefined>(undefined);
  const [color, setColor] = useState<string | undefined>(undefined);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!ready) return <div className="pt-20 text-center text-sm text-ink/40">Chargement…</div>;

  if (!product)
    return (
      <div className="pt-24 text-center">
        <h1 className="font-display text-2xl font-extrabold">Produit introuvable</h1>
        <p className="mt-2 text-sm shop-muted">Il a peut-être été retiré de la boutique.</p>
        <Link href="/boutique/produits" className="btn-primary btn-md mt-5">
          Voir les produits
        </Link>
      </div>
    );

  const currentSize = size ?? product.sizes?.[0];
  const currentColor = color ?? product.colors?.[0];
  const out = product.stock === 0;

  const handleAdd = (goCart: boolean) => {
    add(product.id, currentSize, currentColor, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
    if (goCart) router.push("/boutique/panier");
  };

  return (
    <div className="pt-8">
      <Link
        href="/boutique/produits"
        className="inline-flex items-center gap-1.5 text-sm font-semibold shop-muted hover:text-ink"
      >
        <ArrowLeft size={15} /> Retour aux produits
      </Link>

      <div className="mt-5 grid gap-8 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <ProductVisual
            product={product}
            className="h-80 rounded-3xl sm:h-[420px]"
            iconSize={90}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: palette.accent }}>
            {product.category}
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold">{product.name}</h1>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-display text-3xl font-extrabold" style={{ color: palette.accent }}>
              {fcfa(product.price)}
            </span>
            {product.oldPrice && (
              <span className="text-lg text-ink/40 line-through">{fcfa(product.oldPrice)}</span>
            )}
          </div>
          <p className={`mt-2 text-sm font-semibold ${out ? "text-terra" : "text-primary-dark"}`}>
            {out ? "Épuisé — bientôt de retour" : `En stock · ${product.stock} disponibles`}
          </p>
          <p className="mt-5 whitespace-pre-line text-sm leading-relaxed shop-muted">
            {product.description}
          </p>

          {product.sizes && product.sizes.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-bold">Taille</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`h-10 min-w-[2.75rem] rounded-xl border px-3 text-sm font-bold transition-all ${
                      currentSize === s
                        ? "border-transparent text-white"
                        : "border-ink/15 bg-white hover:border-ink/50"
                    }`}
                    style={currentSize === s ? { backgroundColor: palette.accent } : undefined}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors && product.colors.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-bold">Couleur</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`h-10 rounded-xl border px-4 text-sm font-bold transition-all ${
                      currentColor === c
                        ? "border-transparent text-white"
                        : "border-ink/15 bg-white hover:border-ink/50"
                    }`}
                    style={currentColor === c ? { backgroundColor: palette.accent } : undefined}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center gap-4">
            <p className="text-sm font-bold">Quantité</p>
            <div className="flex items-center gap-1 rounded-full border border-ink/15 shop-surface p-1">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-cream"
                aria-label="Diminuer"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center text-sm font-bold">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-cream"
                aria-label="Augmenter"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => handleAdd(true)}
              disabled={out}
              className="btn btn-lg flex-1 text-white hover:shadow-lift active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40"
              style={{ backgroundColor: palette.accent }}
            >
              <ShoppingBag size={18} /> Commander maintenant
            </button>
            <button
              onClick={() => handleAdd(false)}
              disabled={out}
              className="btn-ghost btn-lg disabled:cursor-not-allowed disabled:opacity-40"
            >
              <AnimatePresence mode="wait" initial={false}>
                {added ? (
                  <motion.span
                    key="ok"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    className="flex items-center gap-2"
                    style={{ color: palette.accent }}
                  >
                    <Check size={18} /> Ajouté !
                  </motion.span>
                ) : (
                  <motion.span
                    key="add"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                  >
                    Ajouter au panier
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
