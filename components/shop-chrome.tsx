"use client";

import { ShopLogo } from "@/components/icons";
import { useCart } from "@/lib/cart";
import { ErrorScreen, LoadingScreen, OfflineBanner } from "@/components/states";
import { paletteVars } from "@/lib/palettes";
import { useStore } from "@/lib/store";
import { ArrowLeft, Menu, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  ["Accueil", "/boutique"],
  ["Produits", "/boutique/produits"],
  ["Livraison", "/boutique/livraison"],
  ["À propos", "/boutique/a-propos"],
  ["Contact", "/boutique/contact"],
];

export default function ShopChrome({
  children,
  preview = false,
}: {
  children: React.ReactNode;
  preview?: boolean;
}) {
  const { count } = useCart();
  const { config, palette, ready, error, reload, hasShop } = useStore();
  const path = usePathname();
  const [open, setOpen] = useState(false);

  if (!ready) return <LoadingScreen label="Chargement de la boutique…" />;
  if (error) return <ErrorScreen onRetry={reload} />;
  if (!hasShop)
    return (
      <ErrorScreen
        title="Boutique introuvable"
        message="Ce lien ne correspond à aucune boutique en ligne."
      />
    );

  return (
    <div className="shop-scope min-h-screen" style={paletteVars(palette)}>
      <OfflineBanner />
      {preview && (
        <div className="bg-ink px-4 py-2 text-center text-xs font-medium text-white/80">
          Aperçu de ta boutique ·{" "}
          <Link href="/dashboard/boutique" className="underline underline-offset-2 hover:text-white">
            Personnaliser
          </Link>{" "}
          ·{" "}
          <Link href="/" className="underline underline-offset-2 hover:text-white">
            Boutik
          </Link>
        </div>
      )}

      <header className="shop-surface sticky top-0 z-40 border-b border-black/5 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/boutique" className="flex min-w-0 items-center gap-2.5">
            <ShopLogo
              logo={config.logo}
              icon={config.logoIcon}
              name={config.name}
              accent={palette.accent}
              size={36}
            />
            <span className="min-w-0">
              <span className="block truncate font-display text-lg font-extrabold leading-tight">
                {config.name}
              </span>
              <span className="block truncate text-[11px] leading-tight text-ink/50">
                {config.tagline}
              </span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-ink/70 md:flex">
            {NAV.map(([l, h]) => (
              <Link
                key={h}
                href={h}
                className={`transition-colors hover:text-ink ${path === h ? "font-bold text-ink" : ""}`}
              >
                {l}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/boutique/panier"
              className="relative rounded-full border border-ink/10 bg-white p-2.5 transition-colors hover:border-ink/30"
              aria-label="Panier"
            >
              <ShoppingBag size={18} />
              {count > 0 && (
                <span
                  key={count}
                  className="animate-pop absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: palette.accent }}
                >
                  {count}
                </span>
              )}
            </Link>
            <button
              className="rounded-full border border-ink/10 bg-white p-2.5 md:hidden"
              onClick={() => setOpen(!open)}
              aria-label="Menu"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="animate-drop border-t border-ink/5 bg-white px-4 py-4 md:hidden">
            <div className="flex flex-col gap-3 text-sm font-medium">
              {NAV.map(([l, h]) => (
                <Link key={h} href={h} onClick={() => setOpen(false)} className="py-1">
                  {l}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24">{children}</main>

      <footer className="shop-surface border-t border-black/5 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 text-center text-sm shop-muted">
          <p className="font-display font-bold text-ink">{config.name}</p>
          <p>{config.hours}</p>
          <Link
            href="/"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold hover:underline"
            style={{ color: palette.accent }}
          >
            <ArrowLeft size={12} /> Boutique créée avec Boutik
          </Link>
        </div>
      </footer>
    </div>
  );
}
