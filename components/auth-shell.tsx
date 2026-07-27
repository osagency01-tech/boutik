"use client";

import { BoutikLogo } from "@/components/brand";
import Link from "next/link";

/* ------------------------------------------------------------------ *
 * Habillage partagé des pages de connexion (/connexion,
 * /connexion/nouveau-mot-de-passe) : un panneau de marque à gauche
 * (masqué sous lg, purement décoratif — jamais de logique dedans) et
 * la colonne formulaire à droite. Chaque page ne fournit que son
 * contenu de formulaire ; toute la logique d'écran (étapes, validation,
 * appels Supabase) reste entièrement dans la page, inchangée.
 *
 * Le nom "Boutik" du panneau est écrit avec la police Breathing (déjà
 * chargée pour l'écran de démarrage) plutôt que le logo PNG : ce
 * dernier est vert fixe (voir public/logo-boutik.png) et perdrait tout
 * contraste sur le fond sombre ci-dessous. */
export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-cream">
      <div
        className="wax-pattern-dense relative hidden w-[40%] shrink-0 flex-col justify-between overflow-hidden p-10 text-white xl:w-[36%] lg:flex"
        style={{ background: "linear-gradient(160deg, #0F241B, #0A6B40 55%, #0D8450)" }}
      >
        <Link href="/" aria-label="Boutik — accueil">
          <span
            className="text-3xl text-white"
            style={{ fontFamily: "Breathing, cursive" }}
          >
            Boutik
          </span>
        </Link>

        <div>
          <p className="font-display text-3xl font-extrabold leading-tight xl:text-4xl">
            Ta boutique en ligne,
            <br />
            prête en 10 minutes.
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
            Crée ta boutique, ajoute tes produits et reçois tes commandes directement sur
            WhatsApp — sans coder, sans commission sur tes ventes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 text-xs font-medium text-white/55">
          <span>Bénin</span>
          <span className="h-1 w-1 rounded-full bg-white/30" />
          <span>Côte d&apos;Ivoire</span>
          <span className="h-1 w-1 rounded-full bg-white/30" />
          <span>Sénégal</span>
          <span className="h-1 w-1 rounded-full bg-white/30" />
          <span>Togo…</span>
        </div>
      </div>

      <div className="flex w-full flex-1 flex-col">
        <header className="mx-auto flex w-full max-w-md items-center px-4 py-6 lg:hidden">
          <BoutikLogo className="h-7" />
        </header>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-16 lg:px-8 lg:py-16">
          {children}
        </main>
      </div>
    </div>
  );
}
