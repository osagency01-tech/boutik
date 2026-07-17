"use client";

import { NotificationCard } from "@/components/install-prompt";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import OnboardingGuide from "@/components/onboarding";
import { ORDERS, STATUS_STYLE, fcfa } from "@/lib/data";
import { shopDomain, shopUrl } from "@/lib/config";
import { useStore } from "@/lib/store";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Copy,
  ExternalLink,
  Package,
  Palette,
  Share2,
  ReceiptText,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function Overview() {
  const { config, products, palette } = useStore();
  const [copied, setCopied] = useState(false);

  const slug =
    config.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "ma-boutique";
  const url = shopDomain(slug);

  const copy = () => {
    navigator.clipboard?.writeText(shopUrl(slug));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const stats = [
    { l: "Ventes du mois", v: fcfa(184500), delta: "+22 % vs juin", icon: TrendingUp },
    { l: "Commandes", v: "31", delta: "+8 cette semaine", icon: ReceiptText },
    { l: "Produits en ligne", v: String(products.length), delta: `Offre ${config.plan}`, icon: Package },
  ];

  return (
    <div>
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Bonjour</h1>
            <p className="mt-1 text-sm text-ink/55">
              Voici ce qui se passe sur <span className="font-bold text-ink">{config.name}</span>{" "}
              aujourd&apos;hui.
            </p>
          </div>
          <Link href="/boutique" className="btn-primary btn-md">
            Voir ma boutique <ExternalLink size={14} />
          </Link>
        </div>
      </Reveal>

      <div className="mt-6 space-y-4">
        <OnboardingGuide />
        <NotificationCard />
      </div>

      <Stagger className="mt-4 grid gap-4 sm:grid-cols-3" gap={0.08}>
        {stats.map((s) => (
          <StaggerItem key={s.l}>
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-ink/45">{s.l}</p>
                <s.icon size={16} style={{ color: palette.accent }} />
              </div>
              <p className="mt-2 font-display text-2xl font-extrabold">{s.v}</p>
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-primary-dark">
                <ArrowUpRight size={13} /> {s.delta}
              </p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal delay={0.12}>
        <div className="card mt-6 grid gap-3 p-5 sm:grid-cols-2">
          <Link
            href="/dashboard/produits"
            className="flex items-center gap-3 rounded-xl bg-cream p-4 transition-colors hover:bg-ink/5"
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: palette.accent + "1A", color: palette.accent }}
            >
              <Package size={18} />
            </span>
            <span>
              <span className="block text-sm font-bold">Ajouter un produit</span>
              <span className="block text-xs text-ink/50">Photo, prix, stock — en 1 minute</span>
            </span>
          </Link>
          <Link
            href="/dashboard/boutique"
            className="flex items-center gap-3 rounded-xl bg-cream p-4 transition-colors hover:bg-ink/5"
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: palette.accent + "1A", color: palette.accent }}
            >
              <Palette size={18} />
            </span>
            <span>
              <span className="block text-sm font-bold">Personnaliser ma boutique</span>
              <span className="block text-xs text-ink/50">Couleur, modèle, textes, livraison</span>
            </span>
          </Link>
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="card mt-6 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-display text-lg font-extrabold">Dernières commandes</h2>
            <Link
              href="/dashboard/commandes"
              className="flex items-center gap-1 text-sm font-bold hover:underline"
              style={{ color: palette.accent }}
            >
              Tout voir <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-ink/5">
            {ORDERS.slice(0, 4).map((o) => (
              <Link
                key={o.id}
                href="/dashboard/commandes"
                className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-cream"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold">
                    {o.id} · <span className="font-semibold text-ink/70">{o.client}</span>
                  </p>
                  <p className="truncate text-xs text-ink/50">
                    {o.items.map((i) => `${i.name} ×${i.qty}`).join(" · ")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="hidden text-sm font-extrabold sm:block">
                    {fcfa(o.items.reduce((s, i) => s + i.qty * i.price, 0))}
                  </span>
                  <span className={`chip ${STATUS_STYLE[o.status]}`}>{o.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.22}>
        <div
          className="wax-pattern-dense mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl px-6 py-5 text-white"
          style={{ background: `linear-gradient(135deg, ${palette.accent}, ${palette.accent}CC)` }}
        >
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-display font-extrabold">
              <Share2 size={16} /> Partage ta boutique
            </p>
            <p className="mt-0.5 truncate text-sm text-white/80">
              {url} — colle ce lien dans ton statut WhatsApp.
            </p>
          </div>
          <button
            className="btn shrink-0 bg-white px-5 py-2.5 text-sm hover:bg-cream"
            style={{ color: palette.accent }}
            onClick={copy}
          >
            {copied ? (
              <span key="ok" className="animate-pop flex items-center gap-1.5">
                <Check size={15} /> Lien copié
              </span>
            ) : (
              <span key="copy" className="flex items-center gap-1.5">
                <Copy size={15} /> Copier le lien
              </span>
            )}
          </button>
        </div>
      </Reveal>
    </div>
  );
}
