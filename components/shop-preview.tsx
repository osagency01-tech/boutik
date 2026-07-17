"use client";

import { getShopIcon } from "@/components/icons";
import { demoImage, getDemoShop } from "@/lib/demo-shops";
import { getPalette } from "@/lib/palettes";
import type { TemplateId } from "@/lib/templates";

/* ------------------------------------------------------------------ *
 * Aperçu d'une boutique de démonstration
 *
 * Remplace les schémas abstraits : un visiteur ne se projette pas
 * dans des rectangles gris. Il lui faut un vrai nom, de vrais
 * produits, de vrais prix.
 *
 * Rendu en HTML/CSS plutôt qu'en image : c'est plus léger qu'une
 * capture d'écran (aucune requête réseau), ça reste net à tous les
 * zooms, et ça suit automatiquement la palette du modèle.
 * ------------------------------------------------------------------ */

const fcfa = (n: number) =>
  n >= 1000000
    ? `${(n / 1000000).toFixed(1).replace(".0", "")} M`
    : n.toLocaleString("fr-FR").replace(/[\u202f\u00a0]/g, " ");

function Icon({ name, size, color, op = 1 }: { name: string; size: number; color: string; op?: number }) {
  const I = getShopIcon(name);
  return <I size={size} style={{ color, opacity: op }} strokeWidth={1.6} />;
}

export default function ShopPreview({ template }: { template: TemplateId }) {
  const shop = getDemoShop(template);
  const p = getPalette(shop.palette);
  const dark = template === "luxury";

  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden rounded-lg"
      style={{ backgroundColor: dark ? "#14231B" : p.bg }}
    >
      {/* En-tête : identique sur tous les modèles, c'est le repère */}
      <div
        className="flex items-center gap-1 px-2 py-1.5"
        style={{ backgroundColor: dark ? "#1b2b22" : p.surface }}
      >
        <span
          className="flex h-3 w-3 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: p.accent + "26" }}
        >
          <Icon name={shop.logoIcon} size={7} color={p.accent} />
        </span>
        <span
          className="truncate text-[5px] font-bold"
          style={{ color: dark ? "#fff" : p.ink }}
        >
          {shop.name}
        </span>
        <span
          className="ml-auto h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: dark ? "#ffffff20" : p.ink + "12" }}
        />
      </div>

      <div className="p-1.5">
        {/* ---------- CLASSIQUE ---------- */}
        {template === "classique" && (
          <>
            <div
              className="flex flex-col justify-center rounded px-2 py-2"
              style={{ background: `linear-gradient(135deg, ${p.accent}, ${p.accent2})` }}
            >
              <p className="text-[4px] font-bold uppercase tracking-wider text-white/70">
                {shop.badge}
              </p>
              <p className="mt-0.5 text-[7px] font-extrabold leading-tight text-white">
                {shop.title}
              </p>
            </div>
            <div className="mt-1.5 grid grid-cols-3 gap-1">
              {shop.products.slice(0, 3).map((pr, i) => (
                <Tile key={pr.name} pr={pr} p={p} h={20} img={demoImage(template, i)} />
              ))}
            </div>
          </>
        )}

        {/* ---------- CATALOGUE ---------- */}
        {template === "catalogue" && (
          <>
            <div className="flex gap-0.5">
              {["Tout", "Céréales", "Épices", "Frais"].map((c, i) => (
                <span
                  key={c}
                  className="rounded-sm px-1 py-0.5 text-[3.5px] font-bold"
                  style={{
                    backgroundColor: i === 0 ? p.accent : p.ink + "0D",
                    color: i === 0 ? "#fff" : p.muted,
                  }}
                >
                  {c}
                </span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-5 gap-0.5">
              {shop.products.slice(0, 10).map((pr, i) => (
                <Tile key={pr.name} pr={pr} p={p} h={11} tiny img={demoImage(template, i)} />
              ))}
            </div>
          </>
        )}

        {/* ---------- VITRINE ---------- */}
        {template === "vitrine" && (
          <>
            <p
              className="text-center text-[3.5px] font-bold uppercase tracking-[0.2em]"
              style={{ color: p.accent }}
            >
              {shop.badge}
            </p>
            <p
              className="mt-0.5 text-center text-[7px] font-extrabold leading-tight"
              style={{ color: p.ink }}
            >
              {shop.title}
            </p>
            <div className="mt-1.5">
              <Tile pr={shop.products[0]} p={p} h={28} wide img={demoImage(template, 0)} />
            </div>
            <div className="mt-1 grid grid-cols-3 gap-1">
              {shop.products.slice(1, 4).map((pr, i) => (
                <Tile key={pr.name} pr={pr} p={p} h={14} img={demoImage(template, i + 1)} />
              ))}
            </div>
          </>
        )}

        {/* ---------- FASHION ---------- */}
        {template === "fashion" && (
          <>
            <div className="relative overflow-hidden rounded">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={demoImage(template, 0)}
                alt=""
                className="h-[38px] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-1">
                <p className="text-[3.5px] font-bold uppercase tracking-[0.2em] text-white/70">
                  {shop.badge}
                </p>
                <p className="text-[7px] font-extrabold uppercase leading-none text-white">
                  {shop.title.slice(0, 28)}
                </p>
              </div>
            </div>
            <div className="mt-1 h-px w-full" style={{ backgroundColor: p.ink }} />
            <div className="mt-1 flex gap-1 overflow-hidden">
              {shop.products.slice(1, 5).map((pr, i) => (
                <div key={pr.name} className="w-[22px] shrink-0">
                  <Tile pr={pr} p={p} h={18} img={demoImage(template, i + 1)} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* ---------- BEAUTY ---------- */}
        {template === "beauty" && (
          <>
            <div
              className="flex flex-col items-center justify-center rounded-xl py-2"
              style={{ backgroundColor: p.accent + "1F" }}
            >
              <p className="text-[3.5px] font-bold uppercase tracking-widest" style={{ color: p.accent }}>
                {shop.badge}
              </p>
              <p className="mt-0.5 px-2 text-center text-[6.5px] font-extrabold leading-tight" style={{ color: p.ink }}>
                {shop.title}
              </p>
            </div>
            <div className="mt-1.5 space-y-1">
              {shop.products.slice(0, 2).map((pr, i) => (
                <div key={pr.name} className={`flex items-center gap-1.5 ${i % 2 ? "flex-row-reverse" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={demoImage(template, i)}
                    alt=""
                    className="h-5 w-5 shrink-0 rounded-lg object-cover"
                  />
                  <div className={`min-w-0 flex-1 ${i % 2 ? "text-right" : ""}`}>
                    <p className="truncate text-[4.5px] font-bold" style={{ color: p.ink }}>
                      {pr.name}
                    </p>
                    <p className="text-[4.5px] font-extrabold" style={{ color: p.accent }}>
                      {fcfa(pr.price)} F
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ---------- FOOD ---------- */}
        {template === "food" && (
          <>
            <div
              className="flex flex-col items-center justify-center rounded py-1.5"
              style={{ background: `linear-gradient(135deg, ${p.accent}, ${p.accent2})` }}
            >
              <p className="text-[3.5px] font-bold uppercase tracking-widest text-white/75">
                {shop.badge}
              </p>
              <p className="text-[6.5px] font-extrabold leading-tight text-white">{shop.title}</p>
            </div>
            <div className="mt-1 space-y-0.5">
              {shop.products.slice(0, 4).map((pr, i) => (
                <div
                  key={pr.name}
                  className="flex items-center gap-1 rounded px-1 py-0.5"
                  style={{ backgroundColor: p.surface }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={demoImage(template, i)}
                    alt=""
                    className="h-3 w-3 shrink-0 rounded-sm object-cover"
                  />
                  <p className="min-w-0 flex-1 truncate text-[4px] font-semibold" style={{ color: p.ink }}>
                    {pr.name}
                  </p>
                  <p className="shrink-0 text-[4px] font-extrabold" style={{ color: p.accent }}>
                    {fcfa(pr.price)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ---------- LUXURY ---------- */}
        {template === "luxury" && (
          <div className="py-1 text-center">
            <p className="text-[3.5px] font-bold uppercase tracking-[0.4em] text-white/40">
              {shop.badge}
            </p>
            <p className="mx-auto mt-1 max-w-[85%] text-[6px] font-light uppercase leading-relaxed tracking-[0.12em] text-white/90">
              {shop.title}
            </p>
            <div className="mx-auto mt-1 h-px w-4" style={{ backgroundColor: p.accent }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={demoImage(template, 0)}
              alt=""
              className="mx-auto mt-2 h-[30px] w-[42px] object-cover opacity-80"
            />
            <p className="text-[4px] font-light uppercase tracking-[0.2em] text-white/60">
              {shop.products[0].name}
            </p>
            <p className="mt-0.5 text-[4px] tracking-widest" style={{ color: p.accent }}>
              {fcfa(shop.products[0].price)} F
            </p>
          </div>
        )}

        {/* ---------- MODERN ---------- */}
        {template === "modern" && (
          <>
            <div className="grid grid-cols-3 grid-rows-2 gap-1" style={{ height: 38 }}>
              <div
                className="col-span-2 row-span-2 flex flex-col justify-center rounded px-1.5"
                style={{ background: `linear-gradient(135deg, ${p.accent}, ${p.accent2})` }}
              >
                <p className="text-[3.5px] font-black uppercase tracking-wider text-white/70">
                  {shop.badge}
                </p>
                <p className="mt-0.5 text-[7px] font-extrabold leading-none text-white">
                  {shop.title}
                </p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={demoImage(template, 0)}
                alt=""
                className="h-full w-full rounded object-cover"
              />
              <div className="flex flex-col items-center justify-center rounded" style={{ backgroundColor: p.ink }}>
                <p className="text-[7px] font-black leading-none text-white">
                  {shop.products.length}
                </p>
                <p className="text-[3px] font-bold uppercase text-white/50">produits</p>
              </div>
            </div>
            <div className="mt-1 grid grid-cols-4 gap-0.5">
              {shop.products.slice(1, 5).map((pr, i) => (
                <Tile key={pr.name} pr={pr} p={p} h={12} tiny img={demoImage(template, i + 1)} />
              ))}
            </div>
          </>
        )}

        {/* ---------- ARTISAN ---------- */}
        {template === "artisan" && (
          <>
            <p
              className="text-center text-[3.5px] font-bold uppercase tracking-[0.25em]"
              style={{ color: p.accent }}
            >
              {shop.badge}
            </p>
            <p className="mt-0.5 text-center text-[6px] font-extrabold leading-tight" style={{ color: p.ink }}>
              {shop.title}
            </p>
            <div className="mt-2 space-y-1.5">
              {shop.products.slice(0, 2).map((pr, i) => (
                <div key={pr.name} className={`flex items-center gap-1.5 ${i % 2 ? "flex-row-reverse" : ""}`}>
                  <div className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={demoImage(template, i)}
                      alt=""
                      className="h-6 w-7 rounded-sm object-cover"
                    />
                    <span
                      className="absolute -left-0.5 -top-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full text-[3px] font-extrabold text-white"
                      style={{ backgroundColor: p.accent }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className={`min-w-0 flex-1 ${i % 2 ? "text-right" : ""}`}>
                    <p className="truncate text-[4.5px] font-bold" style={{ color: p.ink }}>
                      {pr.name}
                    </p>
                    <p className="truncate text-[3.5px]" style={{ color: p.muted }}>
                      {pr.desc.slice(0, 34)}…
                    </p>
                    <p className="text-[4.5px] font-extrabold" style={{ color: p.accent }}>
                      {fcfa(pr.price)} F
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Tile({
  pr,
  p,
  h,
  tiny,
  wide,
  img,
}: {
  pr: { name: string; price: number; icon: string };
  p: ReturnType<typeof getPalette>;
  h: number;
  tiny?: boolean;
  wide?: boolean;
  img?: string;
}) {
  return (
    <div className="overflow-hidden rounded-sm" style={{ backgroundColor: p.surface }}>
      {img ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={img} alt="" className="w-full object-cover" style={{ height: h }} />
      ) : (
        <div
          className="flex items-center justify-center"
          style={{ height: h, backgroundColor: p.accent + "12" }}
        >
          <Icon name={pr.icon} size={Math.max(6, h * 0.4)} color={p.accent} op={0.5} />
        </div>
      )}
      {!tiny && (
        <div className="px-1 py-0.5">
          <p className={`truncate font-semibold ${wide ? "text-[4.5px]" : "text-[3.5px]"}`} style={{ color: p.ink }}>
            {pr.name}
          </p>
          <p className={`font-extrabold ${wide ? "text-[4.5px]" : "text-[3.5px]"}`} style={{ color: p.accent }}>
            {fcfa(pr.price)} F
          </p>
        </div>
      )}
    </div>
  );
}
