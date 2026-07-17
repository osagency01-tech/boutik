"use client";

import { ShopLogo } from "@/components/icons";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { ProductVisual } from "@/components/product-card";
import { fcfa, type Product } from "@/lib/data";
import { useShopProducts, useStore } from "@/lib/store";
import { ArrowRight, Leaf, Sparkles, Star } from "lucide-react";
import Link from "next/link";

/* ============ BUSINESS 1 — FASHION ============ */
/* Magazine : visuel plein cadre, titre superposé, défilé de nouveautés */

export function FashionTemplate() {
  const { config, palette } = useStore();
  const products = useShopProducts();
  const hero = products.find((p) => p.featured) ?? products[0];
  const rest = products.filter((p) => p.id !== hero?.id);

  return (
    <div className="pt-6">
      {hero && (
        <Reveal>
          <Link href={`/boutique/produits/${hero.id}`} className="group relative block">
            <ProductVisual product={hero} className="h-[440px] rounded-2xl sm:h-[540px]" iconSize={110} />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] opacity-85">
                {config.bannerBadge}
              </p>
              <h1 className="mt-3 max-w-lg font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-6xl">
                {config.bannerTitle}
              </h1>
              <span className="mt-6 inline-flex items-center gap-2 border-b-2 border-white pb-1 text-sm font-bold uppercase tracking-widest">
                Voir la pièce <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </Reveal>
      )}

      <Reveal>
        <div className="mt-12 flex items-baseline justify-between border-b-2 border-ink pb-3">
          <h2 className="font-display text-xl font-extrabold uppercase tracking-tight">Le défilé</h2>
          <Link href="/boutique/produits" className="text-xs font-bold uppercase tracking-widest hover:underline">
            Tout voir
          </Link>
        </div>
      </Reveal>

      {/* Défilé horizontal */}
      <Stagger className="nice-scroll mt-6 flex gap-4 overflow-x-auto pb-3" gap={0.06}>
        {rest.map((p) => (
          <StaggerItem key={p.id} className="w-[210px] shrink-0 sm:w-[250px]">
            <Link href={`/boutique/produits/${p.id}`} className="group block">
              <ProductVisual product={p} className="h-[280px] rounded-xl sm:h-[330px]" />
              <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.2em] text-ink/40">
                {p.category}
              </p>
              <h3 className="mt-1 font-display text-sm font-bold uppercase group-hover:underline">
                {p.name}
              </h3>
              <p className="mt-0.5 text-sm font-extrabold" style={{ color: palette.accent }}>
                {fcfa(p.price)}
              </p>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal>
        <div className="mt-16 border-y-2 border-ink py-10 text-center">
          <p className="mx-auto max-w-xl font-display text-2xl font-extrabold uppercase leading-tight tracking-tight">
            {config.bannerSubtitle}
          </p>
        </div>
      </Reveal>
    </div>
  );
}

/* ============ BUSINESS 2 — BEAUTY ============ */
/* Doux : formes arrondies, teintes pastel, bénéfices produits */

export function BeautyTemplate() {
  const { config, palette } = useStore();
  const products = useShopProducts();
  const featured = products.filter((p) => p.featured);
  const shown = (featured.length ? featured : products).slice(0, 3);

  return (
    <div className="pt-8">
      <Reveal>
        <div
          className="relative overflow-hidden rounded-[2.5rem] px-6 py-16 text-center sm:px-12"
          style={{ backgroundColor: palette.accent + "14" }}
        >
          <div
            className="absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl"
            style={{ backgroundColor: palette.accent + "30" }}
          />
          <div
            className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full blur-3xl"
            style={{ backgroundColor: palette.accent + "22" }}
          />
          <p
            className="relative inline-flex items-center gap-1.5 rounded-full bg-white/70 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest"
            style={{ color: palette.accent }}
          >
            <Sparkles size={12} /> {config.bannerBadge}
          </p>
          <h1 className="relative mx-auto mt-5 max-w-lg font-display text-3xl font-extrabold leading-tight sm:text-5xl">
            {config.bannerTitle}
          </h1>
          <p className="relative mx-auto mt-4 max-w-sm text-sm leading-relaxed shop-muted">
            {config.bannerSubtitle}
          </p>
          <Link
            href="/boutique/produits"
            className="btn relative mt-8 rounded-full px-8 py-3.5 text-sm text-white hover:shadow-lift"
            style={{ backgroundColor: palette.accent }}
          >
            Découvrir les soins <ArrowRight size={16} />
          </Link>
        </div>
      </Reveal>

      <Stagger className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: <Leaf size={15} />, t: "Ingrédients naturels" },
          { icon: <Sparkles size={15} />, t: "Testé et approuvé" },
          { icon: <Star size={15} />, t: "Fait avec soin" },
        ].map((x) => (
          <StaggerItem key={x.t}>
            <div className="flex items-center gap-2.5 rounded-full bg-white px-5 py-3 text-xs font-semibold shadow-card">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{ backgroundColor: palette.accent + "1A", color: palette.accent }}
              >
                {x.icon}
              </span>
              {x.t}
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="mt-16 space-y-14">
        {shown.map((p, i) => (
          <Reveal key={p.id}>
            <div
              className={`grid items-center gap-8 md:grid-cols-2 ${i % 2 ? "md:[direction:rtl]" : ""}`}
            >
              <ProductVisual
                product={p}
                className="h-72 rounded-[2rem] sm:h-80"
                iconSize={72}
              />
              <div className="[direction:ltr]">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: palette.accent }}
                >
                  {p.category}
                </p>
                <h3 className="mt-2 font-display text-2xl font-extrabold">{p.name}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed shop-muted">
                  {p.description}
                </p>
                <div className="mt-5 flex items-center gap-4">
                  <span className="font-display text-2xl font-extrabold" style={{ color: palette.accent }}>
                    {fcfa(p.price)}
                  </span>
                  <Link
                    href={`/boutique/produits/${p.id}`}
                    className="btn rounded-full border px-5 py-2 text-xs font-bold"
                    style={{ borderColor: palette.accent, color: palette.accent }}
                  >
                    Découvrir
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div className="mt-16 rounded-[2rem] shop-surface p-8 text-center shadow-card sm:p-12">
          <div className="mx-auto w-fit">
            <ShopLogo
              logo={config.logo}
              icon={config.logoIcon}
              name={config.name}
              accent={palette.accent}
              size={48}
            />
          </div>
          <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed shop-muted">{config.about}</p>
        </div>
      </Reveal>
    </div>
  );
}

/* ============ BUSINESS 3 — FOOD ============ */
/* Menu : catégories en sections, lignes lisibles, prix à droite */

export function FoodTemplate() {
  const { config, palette } = useStore();
  const products = useShopProducts();
  const cats = Array.from(new Set(products.map((p) => p.category)));

  return (
    <div className="pt-8">
      <Reveal>
        <div
          className="wax-pattern-dense relative overflow-hidden rounded-3xl px-6 py-12 text-center text-white"
          style={{ background: `linear-gradient(135deg, ${palette.accent}, ${palette.accent}C0)` }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] opacity-85">
            {config.bannerBadge}
          </p>
          <h1 className="mx-auto mt-3 max-w-lg font-display text-3xl font-extrabold leading-tight sm:text-4xl">
            {config.bannerTitle}
          </h1>
          <a
            href={`https://wa.me/${config.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn mt-6 bg-white px-6 py-3 text-sm hover:bg-cream"
            style={{ color: palette.accent }}
          >
            Commander maintenant
          </a>
        </div>
      </Reveal>

      {/* Ancres catégories */}
      <div className="nice-scroll sticky top-[68px] z-30 -mx-4 mt-6 flex gap-2 overflow-x-auto bg-cream/90 px-4 py-3 backdrop-blur-md">
        {cats.map((c) => (
          <a
            key={c}
            href={`#cat-${c.replace(/\s+/g, "-")}`}
            className="chip shrink-0 border border-ink/15 bg-white shop-muted hover:border-ink/40"
          >
            {c}
          </a>
        ))}
      </div>

      {cats.map((cat) => (
        <div key={cat} id={`cat-${cat.replace(/\s+/g, "-")}`} className="mt-10 scroll-mt-32">
          <Reveal>
            <h2 className="font-display text-2xl font-extrabold">{cat}</h2>
          </Reveal>
          <Stagger className="mt-4 space-y-2.5" gap={0.05}>
            {products
              .filter((p) => p.category === cat)
              .map((p) => (
                <StaggerItem key={p.id}>
                  <Link
                    href={`/boutique/produits/${p.id}`}
                    className="shop-card flex items-center gap-4 p-3 transition-shadow hover:shadow-lift"
                  >
                    <ProductVisual
                      product={p}
                      className="h-20 w-20 shrink-0 rounded-xl"
                      iconSize={30}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-bold">{p.name}</p>
                      <p className="line-clamp-2 text-xs leading-relaxed shop-muted">
                        {p.description}
                      </p>
                      {p.stock === 0 && (
                        <span className="mt-1 inline-block text-[10px] font-bold text-terra">
                          Indisponible aujourd&apos;hui
                        </span>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-lg font-extrabold" style={{ color: palette.accent }}>
                        {fcfa(p.price)}
                      </p>
                      {p.oldPrice && (
                        <p className="text-[11px] text-ink/40 line-through">{fcfa(p.oldPrice)}</p>
                      )}
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

/* ============ PREMIUM 1 — LUXURY BRAND ============ */
/* Sombre, lettrage très espacé, beaucoup de vide, sérif implicite */

export function LuxuryTemplate() {
  const { config, palette } = useStore();
  const products = useShopProducts();
  const hero = products.find((p) => p.featured) ?? products[0];
  const rest = products.filter((p) => p.id !== hero?.id);

  return (
    <div className="-mx-4 -mb-24 bg-ink px-4 pb-24 pt-14 text-white">
      <Reveal>
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.5em] text-white/45">
          {config.bannerBadge}
        </p>
        <h1 className="mx-auto mt-8 max-w-2xl text-center font-display text-3xl font-light uppercase leading-[1.15] tracking-[0.12em] sm:text-4xl">
          {config.bannerTitle}
        </h1>
        <div className="mx-auto mt-8 h-px w-16" style={{ backgroundColor: palette.accent }} />
        <p className="mx-auto mt-8 max-w-md text-center text-sm font-light leading-loose text-white/55">
          {config.bannerSubtitle}
        </p>
      </Reveal>

      {hero && (
        <Reveal delay={0.1}>
          <Link href={`/boutique/produits/${hero.id}`} className="group mx-auto mt-16 block max-w-3xl">
            <ProductVisual product={hero} className="h-[400px] sm:h-[520px]" iconSize={110} />
            <div className="mt-6 text-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/40">
                {hero.category}
              </p>
              <h2 className="mt-3 font-display text-xl font-light uppercase tracking-[0.2em] group-hover:opacity-70">
                {hero.name}
              </h2>
              <p className="mt-2 text-sm tracking-[0.15em]" style={{ color: palette.accent }}>
                {fcfa(hero.price)}
              </p>
            </div>
          </Link>
        </Reveal>
      )}

      <Reveal>
        <p className="mt-24 text-center text-[10px] font-bold uppercase tracking-[0.5em] text-white/45">
          La collection
        </p>
      </Reveal>

      <Stagger className="mx-auto mt-12 grid max-w-4xl gap-x-8 gap-y-16 sm:grid-cols-2" gap={0.1}>
        {rest.map((p) => (
          <StaggerItem key={p.id}>
            <Link href={`/boutique/produits/${p.id}`} className="group block">
              <ProductVisual product={p} className="h-80" />
              <div className="mt-5 text-center">
                <h3 className="font-display text-sm font-light uppercase tracking-[0.2em] group-hover:opacity-70">
                  {p.name}
                </h3>
                <p className="mt-2 text-xs tracking-[0.15em] text-white/50">{fcfa(p.price)}</p>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal>
        <div className="mx-auto mt-28 max-w-lg text-center">
          <div className="mx-auto h-px w-16" style={{ backgroundColor: palette.accent }} />
          <p className="mt-8 text-sm font-light leading-loose text-white/55">{config.about}</p>
          <p
            className="mt-8 text-[10px] font-bold uppercase tracking-[0.4em]"
            style={{ color: palette.accent }}
          >
            {config.name}
          </p>
        </div>
      </Reveal>
    </div>
  );
}

/* ============ PREMIUM 2 — MODERN STORE ============ */
/* Grille asymétrique type bento, blocs colorés, angles vifs */

export function ModernTemplate() {
  const { config, palette } = useStore();
  const products = useShopProducts();
  const p = products;

  return (
    <div className="pt-6">
      {/* Bento hero */}
      <Reveal>
        <div className="grid gap-3 sm:grid-cols-3 sm:grid-rows-2">
          <div
            className="wax-pattern-dense relative overflow-hidden rounded-2xl p-6 text-white sm:col-span-2 sm:row-span-2"
            style={{ background: `linear-gradient(135deg, ${palette.accent}, ${palette.accent}AA)` }}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
              {config.bannerBadge}
            </p>
            <h1 className="mt-3 max-w-sm font-display text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
              {config.bannerTitle}
            </h1>
            <p className="mt-4 max-w-xs text-sm leading-relaxed opacity-85">{config.bannerSubtitle}</p>
            <Link
              href="/boutique/produits"
              className="btn mt-8 rounded-lg bg-white px-5 py-2.5 text-xs font-black uppercase tracking-wider"
              style={{ color: palette.accent }}
            >
              Explorer <ArrowRight size={14} />
            </Link>
          </div>

          {p[0] && (
            <Link href={`/boutique/produits/${p[0].id}`} className="group relative overflow-hidden rounded-2xl">
              <ProductVisual product={p[0]} className="h-44 sm:h-full" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-3">
                <p className="text-[11px] font-black uppercase tracking-wide text-white">{p[0].name}</p>
                <p className="text-[11px] font-bold text-white/80">{fcfa(p[0].price)}</p>
              </div>
            </Link>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
            <div className="flex flex-col justify-center rounded-2xl bg-ink p-4 text-white">
              <p className="font-display text-2xl font-black">{products.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                produits
              </p>
            </div>
            <div className="flex flex-col justify-center rounded-2xl bg-mango p-4">
              <p className="font-display text-2xl font-black">24h</p>
              <p className="text-[10px] font-bold uppercase tracking-wider shop-muted">livraison</p>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Grille asymétrique */}
      <Reveal>
        <h2 className="mt-14 font-display text-2xl font-black uppercase tracking-tight">
          Tout le catalogue
        </h2>
      </Reveal>
      <Stagger className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4" gap={0.05}>
        {p.slice(1).map((prod, i) => (
          <StaggerItem key={prod.id} className={i % 5 === 0 ? "col-span-2" : ""}>
            <Link
              href={`/boutique/produits/${prod.id}`}
              className="group block overflow-hidden rounded-2xl bg-white shadow-card transition-all hover:-translate-y-1 hover:shadow-lift"
            >
              <ProductVisual product={prod} className={i % 5 === 0 ? "h-40" : "h-36"} />
              <div className="p-3">
                <p className="truncate text-xs font-black uppercase tracking-wide">{prod.name}</p>
                <p className="mt-0.5 font-display text-sm font-black" style={{ color: palette.accent }}>
                  {fcfa(prod.price)}
                </p>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}

/* ============ PREMIUM 3 — ARTISAN ============ */
/* Chaleureux, raconté : chaque pièce numérotée avec son histoire */

export function ArtisanTemplate() {
  const { config, palette } = useStore();
  const products = useShopProducts();

  return (
    <div className="pt-10">
      <Reveal>
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto w-fit">
            <ShopLogo
              logo={config.logo}
              icon={config.logoIcon}
              name={config.name}
              accent={palette.accent}
              size={56}
            />
          </div>
          <p
            className="mt-6 text-[11px] font-bold uppercase tracking-[0.3em]"
            style={{ color: palette.accent }}
          >
            {config.bannerBadge}
          </p>
          <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
            {config.bannerTitle}
          </h1>
          <p className="mt-4 text-sm leading-loose shop-muted">{config.bannerSubtitle}</p>
          <div className="mx-auto mt-8 flex items-center gap-3">
            <span className="h-px flex-1" style={{ backgroundColor: palette.accent + "40" }} />
            <span className="text-lg" style={{ color: palette.accent }}>
              ❖
            </span>
            <span className="h-px flex-1" style={{ backgroundColor: palette.accent + "40" }} />
          </div>
        </div>
      </Reveal>

      {/* Pièces numérotées — l'ordre a du sens : c'est l'atelier qui présente */}
      <div className="mt-16 space-y-20">
        {products.map((p, i) => (
          <Reveal key={p.id}>
            <div className={`grid items-center gap-8 md:grid-cols-2 ${i % 2 ? "md:[direction:rtl]" : ""}`}>
              <Link href={`/boutique/produits/${p.id}`} className="group relative block [direction:ltr]">
                <ProductVisual product={p} className="h-80 rounded-2xl sm:h-96" iconSize={90} />
                <span
                  className="absolute -left-3 -top-3 flex h-12 w-12 items-center justify-center rounded-full font-display text-sm font-extrabold text-white shadow-lift"
                  style={{ backgroundColor: palette.accent }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              </Link>
              <div className="[direction:ltr]">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-ink/40">
                  {p.category}
                </p>
                <h3 className="mt-2 font-display text-2xl font-extrabold">{p.name}</h3>
                <p className="mt-4 text-sm leading-loose shop-muted">{p.description}</p>
                <div className="mt-6 flex items-center gap-5">
                  <span className="font-display text-2xl font-extrabold" style={{ color: palette.accent }}>
                    {fcfa(p.price)}
                  </span>
                  <Link
                    href={`/boutique/produits/${p.id}`}
                    className="text-xs font-bold uppercase tracking-widest hover:underline"
                    style={{ color: palette.accent }}
                  >
                    Voir la pièce →
                  </Link>
                </div>
                {p.stock > 0 && p.stock <= 5 && (
                  <p className="mt-3 text-xs font-semibold text-terra">
                    Plus que {p.stock} pièce{p.stock > 1 ? "s" : ""} disponible
                    {p.stock > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div className="mx-auto mt-24 max-w-xl rounded-3xl shop-surface p-10 text-center shadow-card">
          <span className="text-2xl" style={{ color: palette.accent }}>
            ❖
          </span>
          <p className="mt-5 text-sm leading-loose shop-muted">{config.about}</p>
          <p className="mt-6 font-display text-sm font-extrabold" style={{ color: palette.accent }}>
            {config.name}
          </p>
        </div>
      </Reveal>
    </div>
  );
}
