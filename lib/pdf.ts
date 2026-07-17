"use client";

import { jsPDF } from "jspdf";
import type { Palette } from "./palettes";
import type { ShopConfig } from "./store";

/* ------------------------------------------------------------------ *
 * Bon de commande PDF
 *
 * Généré côté client, volontairement :
 *   - zéro appel serveur, donc ça marche même en 3G qui tombe
 *   - pas de coût d'infrastructure
 *   - le vendeur l'a en 200 ms, pas en 3 s
 *
 * Contrepartie : le PDF n'est pas signé et peut être modifié.
 * Il ne vaut pas facture (mention obligatoire ajoutée en pied).
 * Le jour où une vraie facture est nécessaire (comptabilité,
 * abonnements), il faudra la générer côté serveur.
 * ------------------------------------------------------------------ */

export type OrderPdfData = {
  reference: string;
  date: Date;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  customerNote?: string;
  zoneLabel?: string;
  deliveryFee: number;
  items: { name: string; size?: string; qty: number; unitPrice: number }[];
};

/* toLocaleString insère une espace fine insécable (U+202F) pour les
   milliers ; jsPDF ne la rend pas. On la remplace par une espace normale. */
const fmt = (n: number) =>
  n.toLocaleString("fr-FR").replace(/[\u202f\u00a0]/g, " ") + " F";

/* jsPDF ne gère pas nativement les hex : conversion en RGB. */
function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

export function buildOrderPdf(
  config: ShopConfig,
  palette: Palette,
  order: OrderPdfData
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const M = 16; // marge
  const accent = rgb(palette.accent);
  const ink = rgb(palette.ink);

  let y = 0;

  /* ---------- Bandeau ---------- */
  doc.setFillColor(...accent);
  doc.rect(0, 0, W, 32, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text(config.name || "Ma boutique", M, 15);

  if (config.tagline) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(config.tagline.slice(0, 60), M, 21);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("BON DE COMMANDE", W - M, 14, { align: "right" });
  doc.setFontSize(14);
  doc.text(order.reference, W - M, 21, { align: "right" });

  y = 44;

  /* ---------- Date + contact boutique ---------- */
  doc.setTextColor(...ink);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Date : ${order.date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })} à ${order.date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })}`,
    M,
    y
  );

  const contact = [config.phone, config.whatsapp ? `WhatsApp +${config.whatsapp}` : null]
    .filter(Boolean)
    .join("  ·  ");
  if (contact) doc.text(contact, W - M, y, { align: "right" });

  y += 12;

  /* ---------- Client ---------- */
  doc.setDrawColor(230, 230, 230);
  doc.setFillColor(248, 248, 246);
  doc.roundedRect(M, y, W - M * 2, 30, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text("CLIENT", M + 5, y + 7);

  doc.setTextColor(...ink);
  doc.setFontSize(11);
  doc.text(order.customerName, M + 5, y + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(order.customerPhone, M + 5, y + 20);

  if (order.customerAddress) {
    const addr = doc.splitTextToSize(order.customerAddress, 105) as string[];
    doc.text(addr.slice(0, 1), M + 5, y + 25.5);
  }

  if (order.zoneLabel) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text("LIVRAISON", W - M - 5, y + 7, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...ink);
    const zone = doc.splitTextToSize(order.zoneLabel, 60) as string[];
    doc.text(zone.slice(0, 2), W - M - 5, y + 14, { align: "right" });
  }

  y += 40;

  /* ---------- Tableau produits ---------- */
  const colQty = M + 100;
  const colUnit = M + 122;
  const colTotal = W - M;

  doc.setFillColor(...accent);
  doc.rect(M, y, W - M * 2, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("DÉSIGNATION", M + 4, y + 5.5);
  doc.text("QTÉ", colQty, y + 5.5, { align: "center" });
  doc.text("P.U.", colUnit, y + 5.5, { align: "right" });
  doc.text("TOTAL", colTotal - 4, y + 5.5, { align: "right" });

  y += 8;
  doc.setTextColor(...ink);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  let subtotal = 0;
  order.items.forEach((it, i) => {
    /* Saut de page si on déborde : une commande peut avoir 30 lignes. */
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    const line = it.qty * it.unitPrice;
    subtotal += line;

    if (i % 2 === 1) {
      doc.setFillColor(250, 250, 249);
      doc.rect(M, y, W - M * 2, 8, "F");
    }

    const label = it.name + (it.size ? ` (${it.size})` : "");
    const wrapped = doc.splitTextToSize(label, 92) as string[];
    doc.text(wrapped.slice(0, 1), M + 4, y + 5.5);
    doc.text(String(it.qty), colQty, y + 5.5, { align: "center" });
    doc.text(fmt(it.unitPrice), colUnit, y + 5.5, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(fmt(line), colTotal - 4, y + 5.5, { align: "right" });
    doc.setFont("helvetica", "normal");

    y += 8;
  });

  /* ---------- Totaux ---------- */
  y += 4;
  doc.setDrawColor(225, 225, 225);
  doc.line(M + 100, y, W - M, y);
  y += 7;

  doc.setFontSize(9);
  doc.text("Sous-total", colUnit, y, { align: "right" });
  doc.text(fmt(subtotal), colTotal - 4, y, { align: "right" });
  y += 6;

  doc.text("Livraison", colUnit, y, { align: "right" });
  doc.text(fmt(order.deliveryFee), colTotal - 4, y, { align: "right" });
  y += 4;

  const total = subtotal + order.deliveryFee;
  doc.setFillColor(...accent);
  doc.roundedRect(M + 100, y, W - M - (M + 100), 12, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL", colUnit - 14, y + 8);
  doc.text(fmt(total), colTotal - 4, y + 8, { align: "right" });

  y += 20;

  /* ---------- Note client ---------- */
  if (order.customerNote) {
    doc.setTextColor(...ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text("NOTE DU CLIENT", M, y);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...ink);
    const note = doc.splitTextToSize(order.customerNote, W - M * 2) as string[];
    doc.text(note.slice(0, 3), M, y + 5);
    y += 5 + note.slice(0, 3).length * 4.5;
  }

  /* ---------- Pied de page ---------- */
  const footY = 280;
  doc.setDrawColor(230, 230, 230);
  doc.line(M, footY - 6, W - M, footY - 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(150, 150, 150);
  /* Mention obligatoire : ce document n'a pas de valeur comptable. */
  doc.text("Ce document ne vaut pas facture.", M, footY);
  doc.text("Boutique créée avec Boutik", W - M, footY, { align: "right" });

  return doc;
}

/* Ouvre le PDF. Sur mobile, download déclenche le partage natif :
   le vendeur peut l'envoyer directement sur WhatsApp. */
export function downloadOrderPdf(
  config: ShopConfig,
  palette: Palette,
  order: OrderPdfData
) {
  const doc = buildOrderPdf(config, palette, order);
  doc.save(`bon-commande-${order.reference}.pdf`);
}

export function openOrderPdf(
  config: ShopConfig,
  palette: Palette,
  order: OrderPdfData
) {
  const doc = buildOrderPdf(config, palette, order);
  const url = doc.output("bloburl");
  window.open(url, "_blank");
}
