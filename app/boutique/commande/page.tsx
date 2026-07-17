"use client";

import { WhatsAppIcon } from "@/components/phone-icon";
import { useCart } from "@/lib/cart";
import { fcfa } from "@/lib/data";
import { useStore } from "@/lib/store";
import * as api from "@/lib/api";
import { cleanText, normalizePhone, safeWhatsAppNumber, safeWhatsAppText } from "@/lib/security";
import type { OrderPdfData } from "@/lib/pdf";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Download, FileText } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

type Form = { name: string; phone: string; address: string; zone: string; note: string };

export default function CheckoutPage() {
  const { detailed, total, clear } = useCart();
  const { config, palette, shopId, demoMode } = useStore();
  const [form, setForm] = useState<Form>({
    name: "",
    phone: "",
    address: "",
    zone: "",
    note: "",
  });
  const [placed, setPlaced] = useState<null | {
    id: string;
    waUrl: string;
    grand: number;
    pdf: OrderPdfData;
  }>(null);

  const zone = config.zones.find((z) => z.zone === form.zone) ?? config.zones[0];
  const grand = total + zone.price;
  const valid = form.name.trim().length > 1 && form.phone.trim().length >= 8 && form.address.trim().length > 3;

  const waMessage = useMemo(() => {
    const lines = detailed.map(
      (l) => {
        const opts = [l.size, l.color].filter(Boolean).join(", ");
        return `• ${l.product.name}${opts ? ` (${opts})` : ""} × ${l.qty} — ${fcfa(
          l.product.price * l.qty
        )}`;
      }
    );
    return [
      `🧾 *Nouvelle commande — ${config.name}*`,
      "",
      ...lines,
      `Livraison (${zone.zone}) : ${fcfa(zone.price)}`,
      `*Total : ${fcfa(grand)}*`,
      "",
      `👤 ${form.name}`,
      `📱 ${form.phone}`,
      `📍 ${form.address} — ${zone.zone}`,
      form.note ? `📝 ${form.note}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }, [detailed, form, zone, grand, config.name]);

  const [busy, setBusy] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const placeOrder = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setOrderError(null);

    let id = "BK-" + Math.floor(1000 + Math.random() * 9000);

    /* En mode démo on ne persiste rien. Avec Supabase, la commande
       est écrite en base et la référence est générée côté serveur. */
    if (!demoMode && shopId) {
      try {
        const order = await api.createOrder({
          shopId,
          customerName: cleanText(form.name, 60),
          customerPhone: normalizePhone(form.phone),
          customerAddress: cleanText(form.address, 200),
          customerNote: form.note ? cleanText(form.note, 500) : undefined,
          zoneLabel: zone.zone,
          deliveryFee: zone.price,
          items: detailed.map((l) => ({
            productId: l.product.id,
            name: l.product.name,
            size: [l.size, l.color].filter(Boolean).join(" · ") || undefined,
            price: l.product.price,
            qty: l.qty,
          })),
        });
        id = order.reference;
      } catch {
        setBusy(false);
        setOrderError(
          "La commande n'a pas pu être enregistrée. Vérifie ta connexion et réessaie."
        );
        return;
      }
    }

    const waUrl = `https://wa.me/${safeWhatsAppNumber(config.whatsapp)}?text=${safeWhatsAppText(
      `${waMessage}\n\nN° de commande : ${id}`
    )}`;

    /* Snapshot pour le PDF : le panier est vidé juste après. */
    const pdf: OrderPdfData = {
      reference: id,
      date: new Date(),
      customerName: form.name,
      customerPhone: form.phone,
      customerAddress: form.address,
      customerNote: form.note || undefined,
      zoneLabel: zone.zone,
      deliveryFee: zone.price,
      items: detailed.map((l) => ({
        name: l.product.name,
        size: [l.size, l.color].filter(Boolean).join(" · ") || undefined,
        qty: l.qty,
        unitPrice: l.product.price,
      })),
    };

    setPlaced({ id, waUrl, grand, pdf });
    clear();
    setBusy(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---- Confirmation ---- */
  if (placed)
    return (
      <div className="mx-auto max-w-md pt-16 text-center">
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: palette.accent }}
        >
          <Check size={36} strokeWidth={3} />
        </motion.span>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h1 className="mt-6 font-display text-2xl font-extrabold">
            Commande {placed.id} enregistrée !
          </h1>
          <p className="mt-2 text-sm leading-relaxed shop-muted">
            Dernière étape : envoie ta commande au vendeur sur WhatsApp pour
            qu'il la confirme et organise la livraison.
          </p>
          <div className="shop-card mt-6 flex items-center gap-3 p-4 text-left">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-terra-soft text-terra">
              <FileText size={18} />
            </span>
            <div>
              <p className="text-sm font-bold">bon-commande-{placed.id}.pdf</p>
              <p className="text-xs text-ink/50">
                Total {fcfa(placed.grand)} · joint automatiquement au message
              </p>
            </div>
          </div>
          <a
            href={placed.waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn mt-6 w-full bg-[#25D366] py-4 text-base text-white hover:bg-[#1fb958] hover:shadow-lift"
          >
            <WhatsAppIcon className="h-5 w-5" /> Envoyer au vendeur sur WhatsApp
          </a>
          <Link
            href="/boutique"
            className="mt-4 inline-block text-sm font-semibold text-ink/50 hover:text-ink"
          >
            Retour à la boutique
          </Link>
        </motion.div>
      </div>
    );

  /* ---- Panier vide ---- */
  if (detailed.length === 0)
    return (
      <div className="pt-24 text-center">
        <h1 className="font-display text-2xl font-extrabold">Ton panier est vide</h1>
        <Link
          href="/boutique/produits"
          className="btn btn-md mt-5 text-white"
          style={{ backgroundColor: palette.accent }}
        >
          Voir les produits
        </Link>
      </div>
    );

  /* ---- Formulaire ---- */
  return (
    <div className="pt-8">
      <Link
        href="/boutique/panier"
        className="inline-flex items-center gap-1.5 text-sm font-semibold shop-muted hover:text-ink"
      >
        <ArrowLeft size={15} /> Retour au panier
      </Link>
      <h1 className="mt-3 font-display text-3xl font-extrabold">Finaliser ma commande</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr,340px] lg:items-start">
        <div className="shop-card space-y-5 p-6 sm:p-7">
          <Field label="Nom complet *">
            <input
              className="input"
              placeholder="Ex. Aïcha Koné"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Numéro WhatsApp *" hint="Le vendeur te contactera sur ce numéro.">
            <input
              className="input"
              type="tel"
              placeholder="+225 07 00 00 00 00"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label="Zone de livraison *">
            <div className="space-y-2">
              {config.zones.map((z) => (
                <label
                  key={z.zone}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm transition-all ${
                    zone.zone === z.zone ? "" : "border-ink/10 bg-white hover:border-ink/30"
                  }`}
                  style={
                    zone.zone === z.zone
                      ? { borderColor: palette.accent, backgroundColor: palette.accent + "12" }
                      : undefined
                  }
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="zone"
                      style={{ accentColor: palette.accent }}
                      checked={zone.zone === z.zone}
                      onChange={() => setForm({ ...form, zone: z.zone })}
                    />
                    <span>
                      <span className="block font-semibold">{z.zone}</span>
                      <span className="block text-xs text-ink/50">Délai : {z.delay}</span>
                    </span>
                  </span>
                  <span className="font-bold">{fcfa(z.price)}</span>
                </label>
              ))}
            </div>
          </Field>
          <Field label="Adresse / quartier *">
            <input
              className="input"
              placeholder="Ex. Riviera 3, rue des Jardins, immeuble Bleu"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>
          <Field label="Note pour le vendeur (facultatif)">
            <textarea
              className="input min-h-[80px] resize-none"
              placeholder="Ex. Appelez-moi avant de passer."
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </Field>
        </div>

        <div className="shop-card sticky top-24 p-6">
          <h2 className="font-display text-lg font-extrabold">Ta commande</h2>
          <div className="mt-4 space-y-2 text-sm">
            {detailed.map((l) => (
              <div key={l.id + (l.size ?? "") + (l.color ?? "")} className="flex justify-between gap-3">
                <span className="shop-muted">
                  {l.product.name}
                  {[l.size, l.color].filter(Boolean).length > 0
                    ? ` (${[l.size, l.color].filter(Boolean).join(", ")})`
                    : ""}{" "}
                  × {l.qty}
                </span>
                <span className="shrink-0 font-semibold">{fcfa(l.product.price * l.qty)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-ink/10 pt-2 shop-muted">
              <span>Livraison</span>
              <span className="font-semibold">{fcfa(zone.price)}</span>
            </div>
          </div>
          <div className="mt-4 flex justify-between border-t border-ink/10 pt-4">
            <span className="font-bold">Total</span>
            <span className="font-display text-xl font-extrabold" style={{ color: palette.accent }}>
              {fcfa(grand)}
            </span>
          </div>
          {orderError && (
            <p className="mt-4 rounded-xl bg-terra-soft px-3 py-2 text-xs font-semibold text-terra">
              {orderError}
            </p>
          )}
          <button
            onClick={placeOrder}
            disabled={!valid || busy}
            className="btn-ink btn-lg mt-6 w-full disabled:cursor-not-allowed disabled:opacity-35"
          >
            {busy && <Loader2 size={16} className="animate-spin" />}
            {busy ? "Enregistrement…" : "Valider ma commande"}
          </button>
          <p className="mt-3 text-center text-xs leading-relaxed text-ink/45">
            En validant, tes coordonnées sont transmises uniquement au vendeur
            pour traiter ta commande.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-ink/45">{hint}</p>}
    </div>
  );
}
