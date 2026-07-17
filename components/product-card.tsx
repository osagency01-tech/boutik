"use client";

import { ProductPlaceholder } from "@/components/icons";
import { fcfa, type Product } from "@/lib/data";
import { useStore } from "@/lib/store";
import Link from "next/link";

export function ProductVisual({
  product,
  className = "",
  iconSize = 40,
}: {
  product: Product;
  className?: string;
  iconSize?: number;
}) {
  const { config, palette } = useStore();
  return (
    <div className={`relative overflow-hidden bg-cream ${className}`}>
      {product.image ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <ProductPlaceholder icon={product.icon} accent={palette.accent} size={iconSize} />
      )}
      {product.oldPrice && (
        <span className="absolute left-3 top-3 rounded-full bg-terra px-2.5 py-1 text-[10px] font-bold tracking-wide text-white shadow-sm">
          PROMO
        </span>
      )}
      {product.stock === 0 && (
        <span className="absolute inset-x-0 bottom-0 bg-ink/80 py-1.5 text-center text-[11px] font-bold text-white">
          Épuisé
        </span>
      )}
    </div>
  );
}

export default function ProductCard({ product }: { product: Product }) {
  const { config, palette } = useStore();
  return (
    <div className="shop-card group overflow-hidden transition-transform duration-200 hover:-translate-y-1">
      <Link href={`/boutique/produits/${product.id}`} className="block">
        <ProductVisual product={product} className="h-44 sm:h-52" iconSize={44} />
        <div className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/40">
            {product.category}
          </p>
          <h3 className="mt-1 truncate font-display font-bold transition-opacity group-hover:opacity-70">
            {product.name}
          </h3>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-display text-lg font-extrabold" style={{ color: palette.accent }}>
              {fcfa(product.price)}
            </span>
            {product.oldPrice && (
              <span className="text-xs text-ink/40 line-through">{fcfa(product.oldPrice)}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
