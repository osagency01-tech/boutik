"use client";

import { fcfa } from "@/lib/data";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export type DayPoint = { key: string; day: number; sales: number; count: number };

const monthLabel = (d: Date) => d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

/* Ventes jour par jour du mois affiché — une seule série (les ventes de
   CETTE boutique), donc une seule teinte : le jour actif plein, les
   autres en teinte claire. Cliquer un jour (et pas seulement le
   survoler) : la plupart des vendeurs consultent ça au téléphone, où
   il n'y a pas de survol. Les flèches changent de mois — l'historique
   complet reste consultable, pas juste un instantané du mois en cours. */
export function SalesChart({
  days,
  monthDate,
  onPrevMonth,
  onNextMonth,
  canGoNext,
  loading,
  accent,
}: {
  days: DayPoint[];
  monthDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  canGoNext: boolean;
  loading?: boolean;
  accent: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const total = days.reduce((s, d) => s + d.sales, 0);
  const count = days.reduce((s, d) => s + d.count, 0);
  const max = Math.max(1, ...days.map((d) => d.sales));
  const shown = active !== null ? days.find((d) => d.day === active) ?? null : null;

  const changeMonth = (fn: () => void) => {
    setActive(null);
    fn();
  };

  return (
    <div className="card mt-6 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-ink/45">Ventes par jour</p>
          <p className="mt-1 font-display text-2xl font-extrabold">{fcfa(shown ? shown.sales : total)}</p>
          <p className="text-xs font-semibold text-ink/50">
            {shown
              ? `${shown.day} ${monthLabel(monthDate)} · ${shown.count} commande${shown.count > 1 ? "s" : ""}`
              : `${monthLabel(monthDate)} · ${count} commande${count > 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => changeMonth(onPrevMonth)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 text-ink/50 transition-colors hover:border-ink/30 hover:text-ink"
            aria-label="Mois précédent"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="min-w-[7.5rem] text-center text-xs font-bold capitalize">
            {monthLabel(monthDate)}
          </span>
          <button
            type="button"
            onClick={() => changeMonth(onNextMonth)}
            disabled={!canGoNext}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 text-ink/50 transition-colors hover:border-ink/30 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Mois suivant"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Les barres se partagent toute la largeur du bloc (flex-1) au lieu
          d'une largeur fixe par jour : sur un écran large, 31 barres de
          8px ne remplissaient qu'une petite portion à gauche du bloc. */}
      <div
        className={`mt-5 flex h-[110px] items-end gap-[3px] border-b border-ink/10 transition-opacity ${loading ? "opacity-40" : ""}`}
      >
        {days.map((d) => {
          const isActive = active === d.day;
          const h = Math.max(2, Math.round((d.sales / max) * 100));
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => setActive(isActive ? null : d.day)}
              aria-label={`${d.day} ${monthLabel(monthDate)} : ${fcfa(d.sales)}, ${d.count} commande${d.count > 1 ? "s" : ""}`}
              aria-pressed={isActive}
              className="flex h-full flex-1 flex-col items-center justify-end"
            >
              <div
                className="w-full rounded-t-[2px] transition-[height,background-color] duration-150"
                style={{ height: h, backgroundColor: isActive ? accent : accent + "30" }}
              />
            </button>
          );
        })}
      </div>
      <div className="mt-1 flex gap-[3px]">
        {days.map((d) => (
          <div key={d.key} className="flex-1 text-center text-[8px] font-semibold text-ink/35">
            {d.day === 1 || d.day % 5 === 0 ? d.day : ""}
          </div>
        ))}
      </div>
    </div>
  );
}
