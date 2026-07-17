"use client";

import { ShopLogo } from "@/components/icons";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import ProductCard, { ProductVisual } from "@/components/product-card";
import { fcfa } from "@/lib/data";
import { useShopProducts, useStore } from "@/lib/store";
import {
  ArtisanTemplate,
  BeautyTemplate,
  FashionTemplate,
  FoodTemplate,
  LuxuryTemplate,
  ModernTemplate,
} from "@/components/templates";
import { ArrowRight, BadgeCheck, MessageCircle, Truck } from "lucide-react";
import Link from "next/link";

export default function ShopHome() {
  const { config, ready, palette } = useStore();
  const products = useShopProducts();

  if (!ready)
    return <div className="pt-24 text-center text-sm text-ink/40">Chargement…</div>;

  if (products.length === 0)
    return (
      <div className="pt-24 text-center">
        <div className="mx-auto w-fit">
          <ShopLogo
            logo={config.logo}
            icon={config.logoIcon}
            name={config.name}
            accent={palette.accent}
            size={64}
          />
        </div>
        <h1 className="mt-6 font-display text-2xl font-extrabold">
          {config.name || "Ta boutique"} n&apos;a pas encore de produits
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed shop-muted">
          Ajoute ton premier article depuis ton espace vendeur : il apparaîtra ici aussitôt.
        </p>
        <Link
          href="/dashboard/produits"
          className="btn btn-lg mt-6 text-white hover:shadow-lift"
          style={{ backgroundColor: palette.accent }}
        >
          Ajouter un produit <ArrowRight size={17} />
        </Link>
      </div>
    );

  switch (config.template) {
    case "catalogue":
      return <CatalogueTemplate />;
    case "vitrine":
      return <VitrineTemplate />;
    case "fashion":
      return <FashionTemplate />;
    case "beauty":
      return <BeautyTemplate />;
    case "food":
      return <FoodTemplate />;
    case "luxury":
      return <LuxuryTemplate />;
    case "modern":
      return <ModernTemplate />;
    case "artisan":
      return <ArtisanTemplate />;
    default:
      return <ClassiqueTemplate />;
  }
}

/* ============ TEMPLATE 1 — CLASSIQUE ============ */
/* Bannière chaleureuse + réassurance + sélection */

function ClassiqueTemplate() {
  const { config, palette } = useStore();
  const products = useShopProducts();
  const featured = products.filter((p) => p.featured).slice(0, 4);
  const shown = featured.length ? featured : products.slice(0, 4);

  return (
    <div className="pt-8">
      <Reveal>
        <div
          className="wax-pattern-dense relative overflow-hidden rounded-3xl px-6 py-14 text-white sm:px-10 md:py-20"
          style={{ background: `linear-gradient(135deg, ${palette.accent}, ${palette.accent}B3)` }}
        >
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
          <p className="relative text-xs font-bold uppercase tracking-[0.2em] text-white/80">
            {config.bannerBadge}
          </p>
          <h1 className="relative mt-3 max-w-md font-display text-3xl font-extrabold leading-tight sm:text-4xl">
            {config.bannerTitle}
          </h1>
          <p className="relative mt-3 max-w-sm text-sm leading-relaxed text-white/85">
            {config.bannerSubtitle}
          </p>
          <Link
            href="/boutique/produits"
            className="btn relative mt-7 bg-white px-6 py-3 text-sm hover:bg-cream"
            style={{ color: palette.accent }}
          >
            {config.ctaLabel} <ArrowRight size={16} />
          </Link>
        </div>
      </Reveal>

      <Stagger className="mt-8 grid gap-3 sm:grid-cols-3">
        {config.perks.map((t, i) => {
          const icons = [<Truck size={16} key="t" />, <BadgeCheck size={16} key="b" />, <MessageCircle size={16} key="m" />];
          const x = { icon: icons[i % icons.length], t };
          return (
          <StaggerItem key={t + i}>
            <div className="shop-card flex items-center gap-3 px-4 py-3 text-sm font-semibold">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: palette.accent + "1A", color: palette.accent }}
              >
                {x.icon}
              </span>
              {x.t}
            </div>
          </StaggerItem>
        );})}
      </Stagger>

      <div className="mt-14">
        <Reveal>
          <div className="flex items-end justify-between">
            <div>
              <p className="section-eyebrow" style={{ color: palette.accent }}>
                {config.featuredEyebrow}
              </p>
              <h2 className="font-display text-2xl font-extrabold sm:text-3xl">
                {config.featuredTitle}
              </h2>
            </div>
            <Link
              href="/boutique/produits"
              className="hidden items-center gap-1 text-sm font-bold hover:underline sm:flex"
              style={{ color: palette.accent }}
            >
              Tout voir <ArrowRight size={15} />
            </Link>
          </div>
        </Reveal>
        <Stagger className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4" gap={0.07}>
          {shown.map((p) => (
            <StaggerItem key={p.id}>
              <ProductCard product={p} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>

      <Reveal>
        <div className="shop-card mt-14 grid gap-8 p-7 sm:p-10 md:grid-cols-[auto,1fr] md:items-center">
          <ShopLogo
            logo={config.logo}
            icon={config.logoIcon}
            name={config.name}
            accent={palette.accent}
            size={64}
          />
          <div>
            <h2 className="font-display text-xl font-extrabold sm:text-2xl">
              {config.name}, notre histoire.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed shop-muted">{config.about}</p>
            <Link
              href="/boutique/a-propos"
              className="mt-4 inline-flex items-center gap-1 text-sm font-bold hover:underline"
              style={{ color: palette.accent }}
            >
              En savoir plus <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

/* ============ TEMPLATE 2 — CATALOGUE ============ */
/* Bandeau compact + tout le stock dès l'accueil, grille dense */

function CatalogueTemplate() {
  const { config, palette } = useStore();
  const products = useShopProducts();
  const cats = Array.from(new Set(products.map((p) => p.category)));

  return (
    <div className="pt-6">
      <Reveal>
        <div className="shop-card flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ color: palette.accent }}
            >
              {config.bannerBadge}
            </p>
            <h1 className="mt-1 font-display text-2xl font-extrabold">{config.bannerTitle}</h1>
          </div>
          <div className="flex gap-2 text-center">
            <div className="rounded-xl bg-cream px-4 py-2">
              <p className="font-display text-lg font-extrabold" style={{ color: palette.accent }}>
                {products.length}
              </p>
              <p className="text-[10px] font-semibold text-ink/50">articles</p>
            </div>
            <div className="rounded-xl bg-cream px-4 py-2">
              <p className="font-display text-lg font-extrabold" style={{ color: palette.accent }}>
                {cats.length}
              </p>
              <p className="text-[10px] font-semibold text-ink/50">catégories</p>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="nice-scroll mt-4 flex gap-2 overflow-x-auto pb-2">
        {cats.map((c) => (
          <Link
            key={c}
            href="/boutique/produits"
            className="chip shrink-0 border border-ink/15 bg-white shop-muted hover:border-ink/40"
          >
            {c}
          </Link>
        ))}
      </div>

      {cats.map((cat) => (
        <div key={cat} className="mt-8">
          <Reveal>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-lg font-extrabold">{cat}</h2>
              <span className="h-px flex-1 bg-ink/10" />
              <span className="text-xs font-semibold text-ink/40">
                {products.filter((p) => p.category === cat).length}
              </span>
            </div>
          </Reveal>
          <Stagger className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" gap={0.04}>
            {products
              .filter((p) => p.category === cat)
              .map((p) => (
                <StaggerItem key={p.id}>
                  <Link
                    href={`/boutique/produits/${p.id}`}
                    className="shop-card group block overflow-hidden transition-shadow hover:shadow-lift"
                  >
                    <ProductVisual product={p} className="h-32" iconSize={30} />
                    <div className="p-2.5">
                      <p className="truncate text-xs font-bold">{p.name}</p>
                      <p
                        className="mt-0.5 font-display text-sm font-extrabold"
                        style={{ color: palette.accent }}
                      >
                        {fcfa(p.price)}
                      </p>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
          </Stagger>
        </div>
      ))}
    </div>
  );
}

/* ============ TEMPLATE 3 — VITRINE ============ */
/* Éditorial : héros pleine largeur sur le 1er produit, grille aérée */

function VitrineTemplate() {
  const { config, palette } = useStore();
  const products = useShopProducts();
  const hero = products.find((p) => p.featured) ?? products[0];
  const rest = products.filter((p) => p.id !== hero?.id);

  return (
    <div className="pt-6">
      <Reveal>
        <p
          className="text-center text-[11px] font-bold uppercase tracking-[0.3em]"
          style={{ color: palette.accent }}
        >
          {config.bannerBadge}
        </p>
        <h1 className="mx-auto mt-3 max-w-2xl text-center font-display text-4xl font-extrabold leading-[1.1] sm:text-5xl">
          {config.bannerTitle}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-center text-sm leading-relaxed shop-muted">
          {config.bannerSubtitle}
        </p>
      </Reveal>

      {hero && (
        <Reveal delay={0.1}>
          <Link href={`/boutique/produits/${hero.id}`} className="group mt-10 block">
            <ProductVisual
              product={hero}
              className="h-[380px] rounded-3xl sm:h-[460px]"
              iconSize={90}
            />
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink/40">
                  {hero.category}
                </p>
                <h2 className="mt-1 font-display text-2xl font-extrabold group-hover:underline">
                  {hero.name}
                </h2>
              </div>
              <p className="font-display text-2xl font-extrabold" style={{ color: palette.accent }}>
                {fcfa(hero.price)}
              </p>
            </div>
          </Link>
        </Reveal>
      )}

      <Reveal>
        <div className="mt-16 flex items-center gap-4">
          <span className="h-px flex-1 bg-ink/10" />
          <p className="font-display text-sm font-extrabold uppercase tracking-[0.2em] text-ink/50">
            La collection
          </p>
          <span className="h-px flex-1 bg-ink/10" />
        </div>
      </Reveal>

      <Stagger className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3" gap={0.08}>
        {rest.map((p) => (
          <StaggerItem key={p.id}>
            <Link href={`/boutique/produits/${p.id}`} className="group block">
              <ProductVisual product={p} className="h-64 rounded-2xl" />
              <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-ink/40">
                {p.category}
              </p>
              <h3 className="mt-1 font-display text-lg font-bold group-hover:underline">{p.name}</h3>
              <p className="mt-0.5 font-display font-extrabold" style={{ color: palette.accent }}>
                {fcfa(p.price)}
              </p>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal>
        <p className="mx-auto mt-20 max-w-xl text-center font-display text-xl leading-relaxed shop-muted">
          « {config.about} »
        </p>
        <p className="mt-4 text-center text-sm font-bold" style={{ color: palette.accent }}>
          — {config.name}
        </p>
      </Reveal>
    </div>
  );
}
