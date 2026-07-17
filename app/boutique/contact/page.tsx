"use client";

import { Reveal } from "@/components/motion";
import * as api from "@/lib/api";
import { cleanMultiline, cleanText, flagContent, normalizePhone, rateLimit } from "@/lib/security";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";
import { Check, Clock, Instagram, Loader2, Phone, Send } from "lucide-react";
import { useState } from "react";

/* Le client écrit ici, pas sur WhatsApp : le vendeur n'est pas dérangé
   par des « bonjour ». Seule la commande lui parvient sur WhatsApp. */
export default function Contact() {
  const { config, palette, shopId, demoMode } = useStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim().length > 1 && body.trim().length > 4;

  const send = async () => {
    if (!valid || busy) return;
    /* Garde-fou local : le vrai anti-flood est en base
       (guard_message_flood), celui-ci évite les doubles clics. */
    if (!rateLimit(`msg:${shopId}`, 3, 3600_000)) {
      setError("Tu as déjà envoyé plusieurs messages. Réessaie dans une heure.");
      return;
    }

    setBusy(true);
    setError(null);

    if (demoMode) {
      setTimeout(() => {
        setSent(true);
        setBusy(false);
      }, 600);
      return;
    }

    try {
      await api.sendMessage({
        shopId: shopId!,
        name: cleanText(name, 60),
        phone: phone ? normalizePhone(phone) : undefined,
        body: cleanMultiline(body, 1000),
      });
      setSent(true);
    } catch (e: any) {
      setError(
        e?.message === "FLOOD"
          ? "Tu as déjà envoyé plusieurs messages. Réessaie dans une heure."
          : "Le message n'a pas pu être envoyé. Vérifie ta connexion."
      );
    }
    setBusy(false);
  };

  const rows = [
    { icon: <Phone size={16} />, l: "Téléphone", v: config.phone },
    { icon: <Instagram size={16} />, l: "Instagram", v: config.instagram },
    { icon: <Clock size={16} />, l: "Horaires", v: config.hours },
  ].filter((r) => r.v);

  if (sent)
    return (
      <div className="mx-auto max-w-md pt-20 text-center">
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: palette.accent }}
        >
          <Check size={30} strokeWidth={3} />
        </motion.span>
        <h1 className="mt-5 font-display text-2xl font-extrabold">Message envoyé</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed shop-muted">
          {config.name} te répondra dès que possible
          {config.hours ? ` (${config.hours})` : ""}.
        </p>
        <button
          onClick={() => {
            setSent(false);
            setBody("");
          }}
          className="btn-ghost btn-md mt-6"
        >
          Écrire un autre message
        </button>
      </div>
    );

  return (
    <div className="mx-auto max-w-md pt-8">
      <Reveal>
        <h1 className="font-display text-3xl font-extrabold">Contact</h1>
        <p className="mt-2 text-sm shop-muted">
          Une question sur un produit, une taille, la livraison ? Écris-nous ici.
        </p>
      </Reveal>

      <Reveal delay={0.08}>
        <div className="shop-card mt-6 space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-sm font-bold">Ton nom *</label>
            <input
              className="input"
              value={name}
              placeholder="Ex. Aïcha Koné"
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold">Ton numéro</label>
            <input
              className="input"
              type="tel"
              inputMode="tel"
              value={phone}
              placeholder="07 00 00 00 00"
              maxLength={20}
              onChange={(e) => setPhone(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-ink/45">
              Facultatif, mais permet une réponse plus rapide.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold">Ton message *</label>
            <textarea
              className="input min-h-[110px] resize-none"
              value={body}
              placeholder="Ex. Bonjour, la robe « Ama » existe-t-elle en 42 ?"
              maxLength={1000}
              onChange={(e) => setBody(e.target.value)}
            />
            <p className="mt-1 text-right text-[11px] text-ink/35">{body.length}/1000</p>
          </div>

          {error && (
            <p className="rounded-xl bg-terra-soft px-3 py-2 text-xs font-semibold text-terra">
              {error}
            </p>
          )}

          <button
            onClick={send}
            disabled={!valid || busy}
            className="btn btn-lg w-full text-white hover:shadow-lift disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundColor: palette.accent }}
          >
            {busy ? <Loader2 size={17} className="animate-spin" /> : <Send size={16} />}
            {busy ? "Envoi…" : "Envoyer le message"}
          </button>
        </div>
      </Reveal>

      {rows.length > 0 && (
        <Reveal delay={0.16}>
          <p className="mb-2 mt-8 text-xs font-bold uppercase tracking-wider text-ink/40">
            Autres moyens
          </p>
          <div className="shop-card divide-y divide-ink/5">
            {rows.map((r) => (
              <div key={r.l} className="flex items-center gap-3 px-5 py-4">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: palette.accent + "1A", color: palette.accent }}
                >
                  {r.icon}
                </span>
                <div>
                  <p className="text-xs text-ink/45">{r.l}</p>
                  <p className="text-sm font-bold">{r.v}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      )}
    </div>
  );
}
