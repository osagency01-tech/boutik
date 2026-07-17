"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { PRODUCTS, type Product } from "./data";

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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("boutik-cart");
      if (raw) setLines(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("boutik-cart", JSON.stringify(lines));
  }, [lines, ready]);

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
        .map((l) => ({ ...l, product: PRODUCTS.find((p) => p.id === l.id)! }))
        .filter((l) => l.product),
    [lines]
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
