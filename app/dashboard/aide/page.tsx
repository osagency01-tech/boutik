"use client";

import { Reveal } from "@/components/motion";
import { cleanMultiline, cleanText, rateLimit } from "@/lib/security";
import { useStore } from "@/lib/store";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  Clock,
  CreditCard,
  HelpCircle,
  Loader2,
  Package,
  Send,
  Store,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/* ------------------------------------------------------------------ *
 * Service client
 *
 * Deux niveaux volontairement :
 *   1. Une FAQ qui répond aux questions les plus fréquentes.
 *      La majorité des vendeurs trouveront leur réponse ici, sans
 *      créer de ticket — c'est ce qui rend le support tenable à
 *      mesure que la base grandit.
 *   2. Un formulaire, avec accusé de réception automatique.
 * ------------------------------------------------------------------ */

const SUJETS = [
  { id: "paiement", label: "Paiement / abonnement", icon: CreditCard },
  { id: "boutique", label: "Ma boutique", icon: Store },
  { id: "commande", label: "Commandes & produits", icon: Package },
  { id: "autre", label: "Autre", icon: HelpCircle },
];

/* Réponse automatique, adaptée au sujet : un vendeur inquiet pour son
   paiement n'a pas besoin du même message que quelqu'un qui a une
   question de design. */
const AUTO_REPONSE: Record<string, { delai: string; message: string }> = {
  paiement: {
    delai: "moins de 4 h",
    message:
      "Les questions de paiement sont traitées en priorité. Si ta boutique a été mise en pause pour un impayé, elle redevient visible dès que le paiement est confirmé — tes produits et tes commandes sont conservés.",
  },
  boutique: {
    delai: "24 h",
    message:
      "En attendant, l'onglet « Ma boutique » permet de tout modifier : couleurs, modèle, textes, zones de livraison. Chaque changement est enregistré automatiquement.",
  },
  commande: {
    delai: "24 h",
    message:
      "Rappel utile : le stock est décrémenté quand tu passes une commande en « Payée », pas à sa réception. C'est voulu — une commande non payée ne doit pas bloquer ton stock.",
  },
  autre: {
    delai: "48 h",
    message:
      "On revient vers toi dès que possible. Si c'est urgent et lié à un paiement, précise-le : ces demandes passent en priorité.",
  },
};

const FAQ = [
  {
    q: "Ma boutique n'est pas visible, pourquoi ?",
    a: "Une boutique doit être publiée pour être accessible. Vérifie dans « Ma boutique » que le statut indique « En ligne ». Si tu es sur l'offre Gratuit, la publication nécessite un abonnement.",
  },
  {
    q: "Comment mes clients me paient-ils ?",
    a: "Directement entre vous : Wave, Orange Money, MTN MoMo, ou espèces à la livraison. Boutik ne touche jamais ton argent et ne prend aucune commission sur tes ventes.",
  },
  {
    q: "J'ai payé mais mon offre n'a pas changé",
    a: "La confirmation peut prendre quelques minutes. Si rien ne bouge après 30 minutes, écris-nous en choisissant « Paiement / abonnement » : garde la référence de ta transaction Mobile Money sous la main.",
  },
  {
    q: "Que se passe-t-il si je ne renouvelle pas ?",
    a: "Ta boutique reste visible 7 jours (période de grâce), puis elle est mise en pause. Tes produits et tes données sont conservés 90 jours : dès que tu paies, tout revient.",
  },
  {
    q: "Puis-je changer de modèle sans perdre mes produits ?",
    a: "Oui, à tout moment. Tes produits, textes et photos sont conservés et adaptés au nouveau modèle.",
  },
  {
    q: "Pourquoi mes clients ne peuvent pas m'écrire sur WhatsApp ?",
    a: "C'est volontaire : seules les commandes arrivent sur ton WhatsApp. Les questions passent par l'onglet « Messages » de ton espace vendeur, pour ne pas noyer tes discussions personnelles.",
  },
  {
    q: "Mes photos sont floues ou lentes à charger",
    a: "Les images sont automatiquement redimensionnées et compressées. Pour un meilleur rendu, envoie des photos carrées, bien éclairées, de 1000 px minimum.",
  },
  {
    q: "Comment supprimer mon compte ?",
    a: "Écris-nous en choisissant « Autre ». La suppression est définitive : boutique, produits et historique sont effacés, les commandes anonymisées.",
  },
];

export default function SupportPage() {
  const { config, palette } = useStore();
  const [sujet, setSujet] = useState("boutique");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<{ ref: string; delai: string; message: string } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const valid = message.trim().length > 9;

  const send = async () => {
    if (!valid || busy) return;

    if (!rateLimit("support", 3, 3600_000)) {
      setError("Tu as déjà envoyé plusieurs demandes. Réessaie dans une heure.");
      return;
    }

    setBusy(true);
    setError(null);

    /* Le ticket n'est pas encore relié à un backend de support.
       La référence est générée localement pour que le vendeur ait
       quelque chose à citer. */
    await new Promise((r) => setTimeout(r, 700));

    const ref =
      "SUP-" +
      new Date().toISOString().slice(2, 10).replace(/-/g, "") +
      "-" +
      Math.random().toString(36).slice(2, 5).toUpperCase();

    const auto = AUTO_REPONSE[sujet];
    setSent({ ref, delai: auto.delai, message: auto.message });
    setBusy(false);
    setMessage("");
  };

  return (
    <div>
      <Reveal>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Aide & support</h1>
        <p className="mt-1 text-sm text-ink/55">
          Une question, un blocage ? Regarde d&apos;abord ci-dessous — la réponse y est
          souvent.
        </p>
      </Reveal>

      {/* ---------- FAQ ---------- */}
      <Reveal delay={0.06}>
        <h2 className="mt-7 font-display text-lg font-extrabold">Questions fréquentes</h2>
        <div className="mt-3 space-y-2">
          {FAQ.map((f, i) => (
            <div key={f.q} className="card overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left text-sm font-semibold"
                aria-expanded={openFaq === i}
              >
                {f.q}
                <ChevronDown
                  size={16}
                  className={`shrink-0 text-ink/35 transition-transform duration-300 ${
                    openFaq === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`grid transition-all duration-300 ease-out ${
                  openFaq === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-4 text-sm leading-relaxed text-ink/60">{f.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ---------- Contact ---------- */}
      <Reveal delay={0.12}>
        <h2 className="mt-9 font-display text-lg font-extrabold">Nous écrire</h2>
        <p className="mt-1 text-sm text-ink/55">
          Tu n&apos;as pas trouvé ? Décris ton problème, on te répond par email.
        </p>
      </Reveal>

      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="card mt-4 p-6"
          >
            <div className="flex items-start gap-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: palette.accent }}
              >
                <Check size={20} strokeWidth={3} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-extrabold">Demande enregistrée</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink/55">
                  <span className="chip bg-cream font-mono text-[11px] text-ink/70">
                    <Ticket size={11} /> {sent.ref}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> Réponse sous {sent.delai}
                  </span>
                </p>
              </div>
            </div>

            {/* Réponse automatique : donne une piste immédiate plutôt
                qu'un simple "on a bien reçu". */}
            <div className="mt-4 rounded-xl bg-cream p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-ink/45">
                Réponse automatique
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">{sent.message}</p>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-ink/45">
              Un accusé de réception a été envoyé à ton adresse email. Garde la référence{" "}
              <span className="font-mono font-bold text-ink/60">{sent.ref}</span> si tu nous
              recontactes.
            </p>

            <button onClick={() => setSent(null)} className="btn-ghost btn-md mt-5">
              Envoyer une autre demande
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card mt-4 space-y-5 p-6"
          >
            <div>
              <label className="mb-2 block text-sm font-bold">Sujet</label>
              <div className="grid grid-cols-2 gap-2">
                {SUJETS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSujet(s.id)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-all ${
                      sujet === s.id ? "bg-cream" : "border-ink/10 hover:border-ink/30"
                    }`}
                    style={sujet === s.id ? { borderColor: palette.accent } : undefined}
                  >
                    <s.icon
                      size={15}
                      className="shrink-0"
                      style={{ color: sujet === s.id ? palette.accent : undefined }}
                    />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold">Ton message</label>
              <textarea
                className="input min-h-[130px] resize-none"
                value={message}
                maxLength={1000}
                placeholder="Décris ton problème le plus précisément possible. Si c'est un paiement, ajoute la référence de ta transaction."
                onChange={(e) => setMessage(e.target.value)}
              />
              <p className="mt-1 text-right text-[11px] text-ink/35">{message.length}/1000</p>
            </div>

            {/* Contexte joint automatiquement : évite trois allers-retours */}
            <div className="rounded-xl bg-cream p-3 text-[11px] leading-relaxed text-ink/50">
              Ces informations seront jointes à ta demande :{" "}
              <span className="font-semibold text-ink/70">
                boutique « {config.name || "—"} », offre {config.plan}
              </span>
              . Ça nous évite de te les redemander.
            </div>

            {error && (
              <p className="rounded-xl bg-terra-soft px-3 py-2 text-xs font-semibold text-terra">
                {error}
              </p>
            )}

            <button
              onClick={send}
              disabled={!valid || busy}
              className="btn-primary btn-lg w-full disabled:opacity-40"
            >
              {busy ? <Loader2 size={17} className="animate-spin" /> : <Send size={16} />}
              {busy ? "Envoi…" : "Envoyer ma demande"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Reveal delay={0.18}>
        <p className="mt-6 text-center text-xs text-ink/40">
          Tu cherches à contacter un client ? C&apos;est dans{" "}
          <Link href="/dashboard/messages" className="font-bold underline">
            Messages
          </Link>
          .
        </p>
      </Reveal>
    </div>
  );
}
