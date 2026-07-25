"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "./data";
import { useStore } from "./store";

export type CartLine = { id: string; size?: string; color?: string; qty: number };

type CartCtx = {
  lines: CartLine[];
  add: (id: string, size?: string, color?: string, qty?: number) => void;
  setQty: (id: string, size: string | undefined, color: string | undefined, qty: number) => void;
  remove: (id: string, size?: string, color?: string) => void;
  clear: () => void;
  count: number;
  total: number;
  detailed: (CartLine & { product: Product })[];
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({
  children,
  /* Isole le panier par boutique dans localStorage : sans ça, le panier
     d'un vendeur visité plus tôt réapparaîtrait chez un autre. */
  storageKey = "boutik-cart",
}: {
  children: React.ReactNode;
  storageKey?: string;
}) {
  /* Les lignes ne stockent qu'un id : il faut les produits réels de LA
     boutique montée (pas une liste statique) pour les résoudre — sinon
     le panier semble toujours vide dès qu'on n'est pas sur Kadi Store. */
  const { products } = useStore();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    try {
      const raw = localStorage.getItem(storageKey);
      setLines(raw ? JSON.parse(raw) : []);
    } catch {
      setLines([]);
    }
    setReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (ready) localStorage.setItem(storageKey, JSON.stringify(lines));
  }, [lines, ready, storageKey]);

  const same = (l: CartLine, id: string, size?: string, color?: string) =>
    l.id === id && l.size === size && l.color === color;

  const add = (id: string, size?: string, color?: string, qty = 1) =>
    setLines((ls) => {
      const i = ls.findIndex((l) => same(l, id, size, color));
      if (i >= 0) {
        const next = [...ls];
        next[i] = { ...next[i], qty: next[i].qty + qty };
        return next;
      }
      return [...ls, { id, size, color, qty }];
    });

  const setQty = (
    id: string,
    size: string | undefined,
    color: string | undefined,
    qty: number
  ) =>
    setLines((ls) =>
      qty <= 0
        ? ls.filter((l) => !same(l, id, size, color))
        : ls.map((l) => (same(l, id, size, color) ? { ...l, qty } : l))
    );

  const remove = (id: string, size?: string, color?: string) =>
    setLines((ls) => ls.filter((l) => !same(l, id, size, color)));

  const clear = () => setLines([]);

  const detailed = useMemo(
    () =>
      lines
        .map((l) => ({ ...l, product: products.find((p) => p.id === l.id)! }))
        .filter((l) => l.product),
    [lines, products]
  );

  const count = detailed.reduce((s, l) => s + l.qty, 0);
  const total = detailed.reduce((s, l) => s + l.qty * l.product.price, 0);

  return (
    <Ctx.Provider value={{ lines, add, setQty, remove, clear, count, total, detailed }}>
      {children}
    </Ctx.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
