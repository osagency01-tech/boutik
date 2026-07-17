"use client";

import { Reveal } from "@/components/motion";
import { fcfa } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Clock, MapPin, ShieldCheck } from "lucide-react";

export default function Livraison() {
  const { config, palette } = useStore();
  return (
    <div className="mx-auto max-w-2xl pt-8">
      <Reveal>
        <h1 className="font-display text-3xl font-extrabold">Livraison</h1>
        <p className="mt-2 text-sm shop-muted">
          Voici nos zones desservies, les délais et les tarifs.
        </p>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="shop-card mt-6 divide-y divide-ink/5">
          {config.zones.map((z) => (
            <div key={z.zone} className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: palette.accent + "1A", color: palette.accent }}
                >
                  <MapPin size={16} />
                </span>
                <div>
                  <p className="text-sm font-bold">{z.zone}</p>
                  <p className="flex items-center gap-1 text-xs text-ink/50">
                    <Clock size={11} /> {z.delay}
                  </p>
                </div>
              </div>
              <span className="font-display font-extrabold" style={{ color: palette.accent }}>
                {fcfa(z.price)}
              </span>
            </div>
          ))}
        </div>
      </Reveal>
      <Reveal delay={0.2}>
        <div className="shop-card mt-5 flex gap-4 p-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mango-soft text-yellow-700">
            <ShieldCheck size={19} />
          </span>
          <div className="text-sm leading-relaxed shop-muted">
            <p className="font-bold text-ink">Conditions</p>
            <p className="mt-1 whitespace-pre-line">{config.deliveryNote}</p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
