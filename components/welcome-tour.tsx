"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Hand,
  Link2,
  Package,
  Palette,
  MessageCircle,
  X,
} from "lucide-react";
import { useState } from "react";

/* ------------------------------------------------------------------ *
 * Tutoriel de bienvenue
 *
 * Carrousel qui accueille le nouveau vendeur à sa première connexion.
 * Reste dans le thème Boutik (crème, vert, motif wax). Reconsultable
 * depuis l'onglet Aide.
 * ------------------------------------------------------------------ */

const SLIDES = [
  {
    icon: Hand,
    title: "Bienvenue sur Boutik",
    text: "Crée ta boutique en ligne professionnelle et reçois tes commandes automatiquement sur WhatsApp, sans discuter pendant des heures. Voici comment ça marche en 4 étapes.",
  },
  {
    icon: Palette,
    title: "Crée ta boutique",
    text: "Donne vie à ta boutique : choisis son nom, son logo, ses couleurs et un modèle qui te ressemble. Aucune compétence technique nécessaire, tout se fait depuis ton téléphone.",
  },
  {
    icon: Package,
    title: "Ajoute tes produits",
    text: "Ajoute tes articles avec photo, prix et description. Range-les par catégories et mets tes coups de cœur en avant.",
  },
  {
    icon: MessageCircle,
    title: "Reçois tes commandes",
    text: "Dès qu'un client commande, tu reçois tout automatiquement sur WhatsApp et dans ton onglet Commandes : produit, quantité, adresse. Tu gères ensuite le paiement et la livraison directement avec ton client.",
  },
  {
    icon: Link2,
    title: "Publie et partage",
    text: "Abonne-toi pour publier ta boutique et obtenir ton lien personnalisé. Partage-le partout, sur WhatsApp, Instagram, Facebook, TikTok, et commence à vendre à tous tes clients.",
  },
];

export function WelcomeTour({ onClose }: { onClose: () => void }) {
  const { user, demoMode } = useAuth();
  const [i, setI] = useState(0);
  const isLast = i === SLIDES.length - 1;
  const slide = SLIDES[i];
  const Icon = slide.icon;

  /* Marque le tutoriel comme vu en base, puis ferme. */
  const finish = async () => {
    if (!demoMode && user) {
      const sb = supabase();
      if (sb) {
        await sb.from("profiles").update({ tutorial_seen: true }).eq("id", user.id);
      }
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="wax-pattern relative w-full max-w-md overflow-hidden rounded-t-3xl bg-cream p-6 sm:rounded-3xl"
      >
        {/* Bouton passer / fermer */}
        <button
          onClick={finish}
          className="absolute right-4 top-4 z-10 rounded-full p-2 text-ink/40 transition-colors hover:bg-white/60 hover:text-ink"
          aria-label="Fermer"
        >
          <X size={18} />
        </button>

        <div className="relative flex flex-col items-center pt-6 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <Icon size={28} />
              </span>

              <h2 className="mt-5 font-display text-2xl font-extrabold">{slide.title}</h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink/65">{slide.text}</p>
            </motion.div>
          </AnimatePresence>

          {/* Points de progression */}
          <div className="mt-7 flex gap-1.5">
            {SLIDES.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === i ? "w-5 bg-primary" : "w-1.5 bg-ink/20"
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="mt-7 flex w-full items-center gap-3">
            {i > 0 ? (
              <button
                onClick={() => setI((n) => n - 1)}
                className="btn-ghost btn-md shrink-0"
                aria-label="Précédent"
              >
                <ArrowLeft size={16} />
              </button>
            ) : (
              <button
                onClick={finish}
                className="text-sm font-semibold text-ink/50 hover:text-ink"
              >
                Passer
              </button>
            )}

            <div className="flex-1" />

            {isLast ? (
              <button onClick={finish} className="btn-primary btn-md">
                <Check size={16} /> C&apos;est parti
              </button>
            ) : (
              <button onClick={() => setI((n) => n + 1)} className="btn-primary btn-md">
                Suivant <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}