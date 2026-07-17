"use client";

import ProductCard from "@/components/product-card";
import { useShopProducts, useStore } from "@/lib/store";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

export default function Catalogue() {
  const { config, palette } = useStore();
  const products = useShopProducts();
  const [cat, setCat] = useState("Tout");
  const [q, setQ] = useState("");

  const categories = useMemo(
    () => ["Tout", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (cat === "Tout" || p.category === cat) &&
          p.name.toLowerCase().includes(q.toLowerCase())
      ),
    [cat, q, products]
  );

  return (
    <div className="pt-8">
      <h1 className="font-display text-3xl font-extrabold">Tous nos produits</h1>
      <p className="mt-1 text-sm shop-muted">
        {products.length} article{products.length > 1 ? "s" : ""} · commande directe sur WhatsApp
      </p>

      <div className="relative mt-6 max-w-md">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/35" />
        <input
          className="input pl-10"
          placeholder="Rechercher un produit…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="nice-scroll mt-4 flex gap-2 overflow-x-auto pb-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`chip shrink-0 border transition-all ${
              cat === c
                ? "border-transparent text-white"
                : "border-ink/15 bg-white shop-muted hover:border-ink/40"
            }`}
            style={cat === c ? { backgroundColor: palette.accent } : undefined}
          >
            {c}
          </button>
        ))}
      </div>

      <motion.div layout className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.25 }}
            >
              <ProductCard product={p} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <div className="shop-card mt-6 p-10 text-center">
          <p className="font-display text-lg font-bold">Aucun produit trouvé</p>
          <p className="mt-1 text-sm shop-muted">
            Essaie un autre mot-clé ou une autre catégorie.
          </p>
        </div>
      )}
    </div>
  );
}
