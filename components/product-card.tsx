"use client";

import { ProductPlaceholder } from "@/components/icons";
import { fcfa, type Product } from "@/lib/data";
import { useStore } from "@/lib/store";
import Link from "next/link";

export function ProductVisual({
  product,
  className = "",
  iconSize = 40,
  focusTop = false,
  fit = "cover",
}: {
  product: Product;
  className?: string;
  iconSize?: number;
  /* Les photos vendeur gardent leur format d'origine (photo-editor.tsx
     ne recadre plus en carré) ; seul l'affichage ici s'adapte au gabarit
     de chaque template via object-cover, sans jamais toucher la photo
     stockée. Sur les héros très hauts et étroits (Luxury, Fashion,
     Vitrine), une photo au format large ou carré peut encore perdre de
     la hauteur à l'affichage : privilégier le haut plutôt que le centre
     garde plus sûrement le produit visible (visage, sommet d'un
     vêtement porté, haut d'un objet) que le bas. */
  focusTop?: boolean;
  /* "cover" (par défaut) remplit un cadre de hauteur fixe (passée via
     className), quitte à couper les bords — acceptable pour une vignette
     de grille (plusieurs produits alignés, l'uniformité prime). "contain"
     n'impose PAS de hauteur : la photo garde ses proportions naturelles
     et c'est elle qui donne sa hauteur au cadre (large pour une photo
     large, haute pour une photo de robe...), sans jamais rien couper.
     Utilisé sur la fiche produit, seul endroit où un client doit voir
     tout l'article avant d'acheter — className ne doit alors PAS
     contenir de classe de hauteur (h-*), seulement des styles comme
     l'arrondi des coins. */
  fit?: "cover" | "contain";
}) {
  const { config, palette } = useStore();
  /* Sans photo, rien ne dicte plus la hauteur du cadre en mode "contain"
     (elle vient normalement de l'image elle-même) : l'icône de secours a
     besoin d'une hauteur explicite pour rester visible. */
  const noImageFallback = fit === "contain" && !product.image ? "h-80 sm:h-[420px]" : "";
  return (
    <div className={`relative overflow-hidden bg-cream ${className} ${noImageFallback}`}>
      {product.image ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={product.image}
          alt={product.name}
          className={
            fit === "contain"
              ? "mx-auto h-auto max-h-[70vh] w-full object-contain"
              : `h-full w-full object-cover ${focusTop ? "object-top" : ""}`
          }
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
  const { config, palette, basePath } = useStore();
  return (
    <div className="shop-card group overflow-hidden transition-transform duration-200 hover:-translate-y-1">
      <Link href={`${basePath}/produits/${product.id}`} className="block">
        <ProductVisual product={product} className="h-44 sm:h-52" iconSize={44} />
        <div className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/50">
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
              <span className="text-xs text-ink/50 line-through">{fcfa(product.oldPrice)}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
