"use client";

import { ShopLogo } from "@/components/icons";

/* Fond de bannière : photo optionnelle du vendeur + voile de la couleur
   de la boutique par-dessus, pour que le texte reste lisible et que la
   couleur choisie par le vendeur reste dominante (pas juste une photo
   brute). Sans photo, le dégradé plein du modèle reste inchangé — ce
   composant ne rend rien. */
export function BannerBackground({ image, accent }: { image?: string; accent: string }) {
  if (!image) return null;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(135deg, ${accent}B3, ${accent}A6)` }}
      />
    </>
  );
}

/* Badge blanc portant le logo de la boutique, posé dans le coin d'une
   bannière colorée/photo — pour que le bloc affiche l'identité complète
   de la boutique, pas juste son slogan. Le padding et la marge suivent
   toujours 1/4 et 1/2 de `size`, comme les usages d'origine (32px avec
   p-2/mb-4, 24px avec p-1.5/mb-3). */
export function BannerLogoBadge({
  logo,
  icon,
  name,
  accent,
  size = 32,
}: {
  logo?: string;
  icon: string;
  name: string;
  accent: string;
  size?: number;
}) {
  return (
    <span
      className="relative inline-flex rounded-full bg-white shadow-lift"
      style={{ padding: size * 0.25, marginBottom: size * 0.5 }}
    >
      <ShopLogo logo={logo} icon={icon} name={name} accent={accent} size={size} />
    </span>
  );
}
