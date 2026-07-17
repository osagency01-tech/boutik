"use client";

import { useStore } from "@/lib/store";
import {
  ArrowRight,
  Check,
  Circle,
  Package,
  PartyPopper,
  Rocket,
  Share2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ *
 * Guide de démarrage
 *
 * Un vendeur qui arrive sur un dashboard vide ne sait pas quoi faire.
 * Il regarde, ne comprend pas, et ne revient pas. C'est le moment où
 * on le perd — pas plus tard.
 *
 * Ce guide impose un ordre AU DÉBUT seulement. Une fois les étapes
 * faites, il disparaît définitivement et le vendeur retrouve la
 * liberté complète de son espace.
 *
 * Les étapes se cochent toutes seules à partir de l'état réel :
 * on ne demande jamais « as-tu fait ceci ? », on regarde.
 * ------------------------------------------------------------------ */

const DISMISS_KEY = "boutik-guide-fini";

export default function OnboardingGuide() {
  const { config, products, palette, ready } = useStore();
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      setHidden(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setHidden(false);
    }
  }, []);

  if (!ready || hidden) return null;

  /* État réel, pas déclaratif */
  const hasProducts = products.length > 0;
  const hasThree = products.length >= 3;
  const hasPhoto = products.some((p) => p.image);
  const hasWhatsApp = Boolean(config.whatsapp && config.whatsapp.length >= 8);
  const isPublished = config.published;

  const steps = [
    {
      done: true,
      label: "Créer ta boutique",
      hint: "C'est fait",
      href: null,
      cta: null,
    },
    {
      done: hasWhatsApp,
      label: "Ajouter ton numéro WhatsApp",
      hint: "C'est là que tes commandes arriveront",
      href: "/dashboard/boutique",
      cta: "Ajouter",
    },
    {
      done: hasThree,
      label: "Ajouter au moins 3 produits",
      hint: hasProducts
        ? `${products.length} sur 3 — une boutique vide ne vend pas`
        : "Une boutique vide ne vend pas",
      href: "/dashboard/produits",
      cta: hasProducts ? "Continuer" : "Ajouter",
    },
    {
      done: hasPhoto,
      label: "Mettre une vraie photo",
      hint: "Une photo vend 3 fois mieux qu'une icône",
      href: "/dashboard/produits",
      cta: "Ajouter",
    },
    {
      done: isPublished,
      label: "Publier ta boutique",
      hint: "Pour la rendre visible de tes clients",
      href: "/dashboard/abonnement",
      cta: "Publier",
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;
  const next = steps.find((s) => !s.done);
  const pct = (doneCount / steps.length) * 100;

  const finish = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    setHidden(true);
  };

  return (
    <div className="card animate-drop relative overflow-hidden p-5">
        {/* Terminé : on félicite et on s'efface */}
        {allDone ? (
          <div className="flex items-start gap-4">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: palette.accent }}
            >
              <PartyPopper size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-extrabold">Ta boutique est prête !</p>
              <p className="mt-0.5 text-sm text-ink/55">
                Partage ton lien sur WhatsApp, Facebook, TikTok — c&apos;est là que tout se
                joue maintenant.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/boutique" className="btn-primary btn-sm">
                  <Share2 size={14} /> Voir ma boutique
                </Link>
                <button onClick={finish} className="btn-ghost btn-sm">
                  Masquer ce guide
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={finish}
              className="absolute right-3 top-3 rounded-full p-1.5 text-ink/30 transition-colors hover:bg-cream hover:text-ink"
              aria-label="Masquer le guide"
              title="Masquer — tu peux tout faire librement depuis le menu"
            >
              <X size={15} />
            </button>

            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: palette.accent + "1A", color: palette.accent }}
              >
                <Rocket size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display font-extrabold">Bien démarrer</p>
                <p className="text-xs text-ink/50">
                  {doneCount} sur {steps.length} étapes
                </p>
              </div>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-cream">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{ backgroundColor: palette.accent, width: `${pct}%` }}
              />
            </div>

            <div className="mt-4 space-y-1">
              {steps.map((s, i) => {
                const isNext = next === s;
                return (
                  <div
                    key={s.label}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                      isNext ? "bg-cream" : ""
                    }`}
                  >
                    <span className="shrink-0">
                      {s.done ? (
                        <span
                          className="flex h-5 w-5 items-center justify-center rounded-full text-white"
                          style={{ backgroundColor: palette.accent }}
                        >
                          <Check size={12} strokeWidth={3.5} />
                        </span>
                      ) : (
                        <Circle
                          size={20}
                          className={isNext ? "text-ink/40" : "text-ink/15"}
                          strokeWidth={1.5}
                        />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm ${
                          s.done
                            ? "font-medium text-ink/35 line-through"
                            : isNext
                              ? "font-bold"
                              : "font-medium text-ink/50"
                        }`}
                      >
                        {i + 1}. {s.label}
                      </p>
                      {/* On ne montre l'aide que sur l'étape en cours :
                          tout afficher noierait le vendeur. */}
                      {isNext && <p className="text-xs text-ink/50">{s.hint}</p>}
                    </div>

                    {isNext && s.href && (
                      <Link
                        href={s.href}
                        className="btn btn-sm shrink-0 text-white"
                        style={{ backgroundColor: palette.accent }}
                      >
                        {s.cta} <ArrowRight size={13} />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
    </div>
  );
}

/* Encart affiché sur la page Produits quand la boutique est vide.
   Le vendeur y arrive sans savoir par quoi commencer. */
export function EmptyProductsGuide({ onAdd }: { onAdd: () => void }) {
  const { palette } = useStore();
  return (
    <div className="card mt-5 p-8 text-center sm:p-12">
      <span
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ backgroundColor: palette.accent + "1A", color: palette.accent }}
      >
        <Package size={26} />
      </span>
      <p className="mt-5 font-display text-lg font-extrabold">Ajoute ton premier produit</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink/55">
        Prends une photo près d&apos;une fenêtre, sur un fond uni. Mets un nom clair et un
        prix. C&apos;est tout — ton produit sera en ligne.
      </p>
      <button onClick={onAdd} className="btn-primary btn-md mt-6">
        <Package size={15} /> Ajouter un produit
      </button>
    </div>
  );
}
