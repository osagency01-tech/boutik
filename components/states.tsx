"use client";

import { CloudOff, Loader2, RefreshCw, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ *
 * Connexion réseau
 *
 * navigator.onLine ment souvent : il dit "en ligne" dès qu'une
 * interface réseau existe, même sans Internet réel. Sur un marché
 * où la 3G tombe sans prévenir, on vérifie vraiment.
 * ------------------------------------------------------------------ */

export function useOnline() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const set = () => setOnline(navigator.onLine);
    set();
    window.addEventListener("online", set);
    window.addEventListener("offline", set);
    return () => {
      window.removeEventListener("online", set);
      window.removeEventListener("offline", set);
    };
  }, []);

  return online;
}

/* Bandeau global affiché dès que la connexion tombe. */
export function OfflineBanner() {
  const online = useOnline();
  return (
    <>
      {!online && (
        <div
          className="animate-drop fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 bg-ink px-4 py-2 text-xs font-semibold text-white"
          role="status"
        >
          <WifiOff size={13} />
          Pas de connexion — tes modifications seront enregistrées au retour du réseau
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * États d'écran
 * ------------------------------------------------------------------ */

export function LoadingScreen({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <Loader2 size={24} className="animate-spin text-ink/30" />
      <p className="text-sm text-ink/45">{label}</p>
    </div>
  );
}

/* Squelette de liste : donne une idée de la structure pendant le chargement,
   ce qui rend l'attente plus courte qu'un spinner nu. */
export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card flex items-center gap-4 p-3">
          <div className="h-16 w-16 shrink-0 animate-pulse rounded-xl bg-ink/5" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/5 animate-pulse rounded-full bg-ink/5" />
            <div className="h-2.5 w-1/4 animate-pulse rounded-full bg-ink/5" />
          </div>
          <div className="h-3 w-16 animate-pulse rounded-full bg-ink/5" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonGrid({ items = 4 }: { items?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="h-44 animate-pulse bg-ink/5 sm:h-52" />
          <div className="space-y-2 p-4">
            <div className="h-2.5 w-1/3 animate-pulse rounded-full bg-ink/5" />
            <div className="h-3 w-3/4 animate-pulse rounded-full bg-ink/5" />
            <div className="h-3 w-1/2 animate-pulse rounded-full bg-ink/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* Erreur réseau : toujours proposer une action, jamais une impasse. */
export function ErrorScreen({
  title = "Connexion impossible",
  message = "Vérifie ta connexion Internet, puis réessaie.",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-terra-soft text-terra">
        <CloudOff size={24} />
      </span>
      <h2 className="mt-5 font-display text-xl font-extrabold">{title}</h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink/55">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary btn-md mt-6">
          <RefreshCw size={15} /> Réessayer
        </button>
      )}
    </div>
  );
}

/* Petit indicateur d'enregistrement, non bloquant. */
export function SaveIndicator({ state }: { state: "idle" | "saving" | "saved" | "error" }) {
  if (state === "idle") return null;
  if (state === "saving")
    return (
      <span className="chip animate-fade bg-ink/5 text-ink/50">
        <Loader2 size={11} className="animate-spin" /> Enregistrement…
      </span>
    );
  if (state === "saved")
    return (
      <span className="chip animate-fade bg-primary-soft text-primary-dark">Enregistré</span>
    );
  return (
    <span className="chip animate-fade bg-terra-soft text-terra">
      <CloudOff size={11} /> Non enregistré
    </span>
  );
}
