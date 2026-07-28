"use client";

import Link from "next/link";

/* ------------------------------------------------------------------ *
 * Habillage partagé des pages de connexion (/connexion,
 * /connexion/nouveau-mot-de-passe). `children` n'est rendu qu'UNE
 * SEULE fois (jamais dupliqué dans deux blocs mobile/desktop séparés,
 * ce qui monterait deux instances indépendantes du formulaire) : seul
 * le conteneur autour s'adapte par classes responsives.
 *
 *   - Desktop (lg+) : bande de marque fixe à gauche, colonne
 *     formulaire simple à droite, sans habillage — inchangé.
 *   - Mobile : la bande devient un bandeau compact en haut, et le
 *     formulaire vit dans une carte blanche qui remonte légèrement
 *     par-dessus (arrondi + ombre), pour ne pas laisser le formulaire
 *     nu sur fond crème.
 *
 * Le nom "Boutik" du bandeau est écrit avec la police Breathing (déjà
 * chargée pour l'écran de démarrage) plutôt que le logo PNG : ce
 * dernier est vert fixe (voir public/logo-boutik.png) et perdrait tout
 * contraste sur le fond sombre ci-dessous. */
export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream lg:flex">
      <div
        className="wax-pattern-dense relative flex shrink-0 flex-col justify-between overflow-hidden px-5 pb-16 pt-6 text-white lg:w-[40%] lg:p-10 xl:w-[36%]"
        style={{ background: "linear-gradient(160deg, #0F241B, #0A6B40 55%, #0D8450)" }}
      >
        <Link href="/" aria-label="Boutik — accueil">
          <span
            className="text-2xl text-white lg:text-3xl"
            style={{ fontFamily: "Breathing, cursive" }}
          >
            Boutik
          </span>
        </Link>

        <div className="mt-4 lg:mt-0">
          <p className="max-w-[260px] font-display text-xl font-extrabold leading-snug lg:max-w-none lg:text-3xl xl:text-4xl">
            Ta boutique en ligne, prête en 10 minutes.
          </p>
          <p className="mt-3 hidden max-w-sm text-sm leading-relaxed text-white/70 lg:block">
            Crée ta boutique, ajoute tes produits et reçois tes commandes directement sur
            WhatsApp — sans coder, sans commission sur tes ventes.
          </p>
        </div>

        <div className="hidden items-center gap-2.5 text-xs font-medium text-white/55 lg:flex">
          <span>Bénin</span>
          <span className="h-1 w-1 rounded-full bg-white/30" />
          <span>Côte d&apos;Ivoire</span>
          <span className="h-1 w-1 rounded-full bg-white/30" />
          <span>Sénégal</span>
          <span className="h-1 w-1 rounded-full bg-white/30" />
          <span>Togo…</span>
        </div>

        {/* Décor : visible seulement sur le bandeau mobile, où le
            texte est court et laisse de la place. */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl lg:hidden" />
      </div>

      <div className="flex w-full flex-1 flex-col">
        <main className="relative z-10 mx-auto -mt-9 w-full max-w-md flex-1 rounded-t-[2rem] bg-white px-5 pb-16 pt-7 shadow-lift lg:mt-0 lg:flex lg:flex-col lg:justify-center lg:rounded-none lg:bg-transparent lg:px-8 lg:py-16 lg:shadow-none">
          {children}
        </main>
      </div>
    </div>
  );
}
