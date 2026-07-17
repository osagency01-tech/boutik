"use client";

import { PALETTES, PALETTE_FAMILIES, type Palette } from "@/lib/palettes";
import { Check } from "lucide-react";

/* Vignette d'une palette : montre la boutique en 3 bandes
   (bannière, surface, accent) plutôt qu'une pastille isolée —
   le vendeur voit l'ambiance, pas juste une couleur. */
function Swatch({ p, active }: { p: Palette; active: boolean }) {
  return (
    <div
      className="overflow-hidden rounded-lg ring-1 ring-black/5"
      style={{ backgroundColor: p.bg }}
    >
      <div
        className="h-6"
        style={{ background: `linear-gradient(135deg, ${p.accent}, ${p.accent2})` }}
      />
      <div className="flex items-center gap-1 p-1.5">
        <span
          className="h-3 flex-1 rounded-sm"
          style={{ backgroundColor: p.surface, boxShadow: "0 0 0 1px rgba(0,0,0,.06)" }}
        />
        <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: p.accent }} />
        <span className="h-3 w-2 shrink-0 rounded-sm" style={{ backgroundColor: p.ink }} />
      </div>
      {active && (
        <div
          className="flex items-center justify-center py-0.5"
          style={{ backgroundColor: p.accent }}
        >
          <Check size={9} strokeWidth={3} style={{ color: p.onAccent }} />
        </div>
      )}
    </div>
  );
}

export default function PalettePicker({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <div className="space-y-4">
      {PALETTE_FAMILIES.map((fam) => {
        const list = PALETTES.filter((p) => p.family === fam);
        return (
          <div key={fam}>
            <div className="mb-1.5 flex items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink/40">{fam}</p>
              <span className="h-px flex-1 bg-ink/8" />
            </div>
            <div className={`grid gap-2 ${compact ? "grid-cols-5" : "grid-cols-3 sm:grid-cols-5"}`}>
              {list.map((p) => {
                const active = value === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => onChange(p.id)}
                    title={p.name}
                    aria-label={`Palette ${p.name}`}
                    aria-pressed={active}
                    className={`rounded-xl border p-1 text-left transition-all ${
                      active
                        ? "scale-[1.03] border-ink shadow-card"
                        : "border-ink/10 hover:border-ink/40"
                    }`}
                  >
                    <Swatch p={p} active={active} />
                    {!compact && (
                      <p className="mt-1 truncate px-0.5 text-[10px] font-semibold text-ink/60">
                        {p.name}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
