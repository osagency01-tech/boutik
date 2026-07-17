"use client";

import { ShopLogo } from "@/components/icons";
import { Reveal } from "@/components/motion";
import { useStore } from "@/lib/store";

export default function APropos() {
  const { config, products, palette } = useStore();
  return (
    <div className="mx-auto max-w-2xl pt-8">
      <Reveal>
        <ShopLogo
          logo={config.logo}
          icon={config.logoIcon}
          name={config.name}
          accent={palette.accent}
          size={64}
        />
        <h1 className="mt-5 font-display text-3xl font-extrabold">À propos de {config.name}</h1>
        <p className="mt-1 text-sm text-ink/50">{config.tagline}</p>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-ink/75">
          <p>{config.about}</p>
        </div>
      </Reveal>
      <Reveal delay={0.2}>
        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
          {[
            [String(products.length), "produits"],
            [String(config.zones.length), "zones livrées"],
            ["7 j/7", "sur WhatsApp"],
          ].map(([n, l]) => (
            <div key={l} className="shop-card px-3 py-5">
              <p className="font-display text-xl font-extrabold" style={{ color: palette.accent }}>
                {n}
              </p>
              <p className="mt-1 text-xs shop-muted">{l}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
