"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getShopIcon } from "@/components/icons";
import { WhatsAppIcon } from "@/components/phone-icon";
import { Check, ChevronLeft, ChevronRight, FileText, Shirt, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";

const STEPS = ["shop", "order", "whatsapp"] as const;
type Step = (typeof STEPS)[number];

const LABELS: Record<Step, string> = {
  shop: "1 · Le client visite ta boutique",
  order: "2 · Il passe commande",
  whatsapp: "3 · Tu reçois la commande sur WhatsApp",
};

export default function PhoneDemo() {
  const [step, setStep] = useState<Step>("shop");
  const [manual, setManual] = useState(false);
  const reduce = useReducedMotion();

  /* Défilement automatique, sauf si l'utilisateur a pris la main :
     lui arracher l'écran des doigts serait pénible. */
  useEffect(() => {
    if (reduce || manual) return;
    const t = setInterval(() => {
      setStep((s) => STEPS[(STEPS.indexOf(s) + 1) % STEPS.length]);
    }, 3200);
    return () => clearInterval(t);
  }, [reduce, manual]);

  const go = (dir: 1 | -1) => {
    setManual(true);
    setStep((s) => {
      const i = (STEPS.indexOf(s) + dir + STEPS.length) % STEPS.length;
      return STEPS[i];
    });
  };

  const pick = (s: Step) => {
    setManual(true);
    setStep(s);
  };

  return (
    <div className="relative mx-auto w-[290px] sm:w-[320px]">
      {/* Halo */}
      <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-br from-primary/15 via-mango/20 to-terra/10 blur-2xl" />

      {/* Cadre téléphone — glissable au doigt */}
      <div className="relative overflow-hidden rounded-[2.4rem] border-[10px] border-ink bg-white shadow-lift">
        <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-ink" />
        <motion.div
          className="h-[560px] pt-9"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragEnd={(_, info) => {
            if (info.offset.x < -50) go(1);
            else if (info.offset.x > 50) go(-1);
          }}
        >
          <AnimatePresence mode="wait">
            {step === "shop" && <ShopScreen key="shop" />}
            {step === "order" && <OrderScreen key="order" />}
            {step === "whatsapp" && <WhatsAppScreen key="wa" />}
          </AnimatePresence>
        </motion.div>

        {/* Flèches : le glissement n'est pas découvrable à la souris */}
        <button
          onClick={() => go(-1)}
          aria-label="Étape précédente"
          className="absolute left-1 top-1/2 z-20 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-ink shadow-card backdrop-blur transition-opacity hover:bg-white sm:flex"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => go(1)}
          aria-label="Étape suivante"
          className="absolute right-1 top-1/2 z-20 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-ink shadow-card backdrop-blur transition-opacity hover:bg-white sm:flex"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Légende + points d'étape */}
      <div className="mt-5 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-sm font-semibold text-ink/70"
          >
            {LABELS[step]}
          </motion.p>
        </AnimatePresence>
        <p className="mt-2 text-xs text-ink/35 sm:hidden">Glisse pour voir les étapes</p>
        <div className="mt-3 flex justify-center gap-2">
          {STEPS.map((s) => (
            <button
              key={s}
              aria-label={LABELS[s]}
              onClick={() => pick(s)}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step ? "w-7 bg-primary" : "w-2 bg-ink/15 hover:bg-ink/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const screen = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
  transition: { duration: 0.35, ease: "easeOut" as const },
};

function ShopScreen() {
  return (
    <motion.div {...screen} className="h-full bg-cream px-3">
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-soft">
            <Shirt size={12} className="text-primary" strokeWidth={2.5} />
          </span>
          <div>
            <p className="font-display text-sm font-bold">Kadi Store</p>
            <p className="text-[10px] text-ink/50">kadi.boutik-app.com</p>
          </div>
        </div>
        <div className="relative rounded-full bg-white p-1.5 shadow-card">
          <ShoppingBag size={14} />
          <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-terra text-[8px] font-bold text-white">
            2
          </span>
        </div>
      </div>
      <div className="rounded-xl bg-gradient-to-br from-primary to-primary-dark p-3 text-white">
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
          Nouveautés wax
        </p>
        <p className="font-display text-sm font-bold">−15 % cette semaine</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[
          ["shirt", "Robe « Ama »", "18 500 F"],
          ["bag", "Sac Bogolan", "12 000 F"],
          ["sparkles", "Karité pur", "3 500 F"],
          ["shirt", "Chemise wax", "15 000 F"],
        ].map(([e, n, p], i) => (
          <motion.div
            key={n}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className="rounded-xl bg-white p-2 shadow-card"
          >
            <div className="flex h-16 items-center justify-center rounded-lg bg-primary-soft">
              {(() => {
                const I = getShopIcon(e);
                return <I size={22} className="text-primary/60" strokeWidth={1.5} />;
              })()}
            </div>
            <p className="mt-1.5 truncate text-[10px] font-semibold">{n}</p>
            <p className="text-[10px] font-bold text-primary">{p}</p>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-3 rounded-full bg-ink py-2.5 text-center text-[11px] font-bold text-white"
      >
        Commander
      </motion.div>
    </motion.div>
  );
}

function OrderScreen() {
  return (
    <motion.div {...screen} className="h-full bg-white px-4">
      <p className="py-2 font-display text-sm font-bold">Ma commande</p>
      <div className="rounded-xl bg-cream p-3">
        <div className="flex justify-between text-[11px]">
          <span>Robe « Ama » (M) × 1</span>
          <span className="font-bold">18 500 F</span>
        </div>
        <div className="mt-1.5 flex justify-between text-[11px]">
          <span>Karité pur × 1</span>
          <span className="font-bold">3 500 F</span>
        </div>
        <div className="mt-2 border-t border-ink/10 pt-2 text-right text-xs font-bold text-primary">
          Total : 22 000 F
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {[
          ["Nom", "Aïcha Koné"],
          ["WhatsApp", "+225 07 09 11 22 33"],
          ["Quartier", "Cocody, Riviera 3"],
        ].map(([l, v], i) => (
          <motion.div
            key={l}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.12 }}
            className="rounded-xl border border-ink/10 px-3 py-2"
          >
            <p className="text-[9px] uppercase tracking-wider text-ink/40">{l}</p>
            <p className="text-[11px] font-semibold">{v}</p>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.65 }}
        className="mt-4 flex items-center justify-center gap-1.5 rounded-full bg-[#25D366] py-2.5 text-[11px] font-bold text-white"
      >
        <WhatsAppIcon className="h-3.5 w-3.5" />
        Envoyer au vendeur sur WhatsApp
      </motion.div>
    </motion.div>
  );
}

function WhatsAppScreen() {
  return (
    <motion.div {...screen} className="h-full bg-[#E5DDD5] px-3">
      <div className="-mx-3 flex items-center gap-2 bg-[#075E54] px-3 py-2.5 text-white">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
          AK
        </div>
        <div>
          <p className="text-[11px] font-bold">Aïcha Koné</p>
          <p className="text-[9px] opacity-75">en ligne</p>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.25 }}
        className="mt-4 max-w-[85%] rounded-xl rounded-tl-sm bg-white p-3 shadow-card"
      >
        <p className="text-[10px] font-bold text-primary">🧾 Commande BK-1042</p>
        <div className="mt-1.5 space-y-0.5 text-[10px] text-ink/80">
          <p>• Robe « Ama » (M) × 1 — 18 500 F</p>
          <p>• Karité pur × 1 — 3 500 F</p>
          <p className="font-bold text-ink">Total : 22 000 F</p>
          <p className="pt-1">📍 Cocody, Riviera 3</p>
          <p>👤 Aïcha Koné · +225 07 09 11 22 33</p>
        </div>
        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-cream px-2 py-1.5">
          <FileText size={11} className="text-ink/50" />
          <span className="text-[9px] font-semibold">bon-commande-BK-1042.pdf</span>
        </div>
        <p className="mt-1 text-right text-[8px] text-ink/40">09:14 ✓✓</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.1 }}
        className="ml-auto mt-3 max-w-[80%] rounded-xl rounded-tr-sm bg-[#DCF8C6] p-3 shadow-card"
      >
        <p className="text-[10px] text-ink/85">
          Merci Aïcha 🙏 Paiement par Wave ou Orange Money au 07 00 00 00 00.
          Livraison demain avant 13 h !
        </p>
        <p className="mt-1 text-right text-[8px] text-ink/40">09:16 ✓✓</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.9 }}
        className="mx-auto mt-4 flex w-fit items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[10px] font-bold text-white"
      >
        <Check size={12} /> Commande enregistrée dans ton espace vendeur
      </motion.div>
    </motion.div>
  );
}


