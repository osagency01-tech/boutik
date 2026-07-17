"use client";

import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ *
 * Écran de démarrage
 *
 * Affiché une fois par session, pas à chaque navigation : passé la
 * première fois, c'est une perte de temps pour le vendeur qui revient
 * dix fois par jour dans son dashboard.
 *
 * Durée volontairement courte (1,1 s) : assez pour asseoir la marque,
 * pas assez pour agacer. Sur une connexion lente, il masque de toute
 * façon un temps de chargement réel.
 * ------------------------------------------------------------------ */

const SEEN_KEY = "boutik-splash-seen";

export default function Splash() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    /* sessionStorage : réapparaît si l'onglet est fermé et rouvert,
       jamais pendant la navigation. */
    let seen = true;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      /* navigation privée : on n'insiste pas */
    }
    if (seen) return;

    setShow(true);
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {}

    /* Deux temps : on lance le fondu, puis on démonte. */
    const t1 = setTimeout(() => setLeaving(true), 1100);
    const t2 = setTimeout(() => {
      setShow(false);
      setLeaving(false);
    }, 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  /* `show` seul décide : `leaving` ne pilote que le fondu.
     L'ancienne condition (!show && !leaving) laissait le splash monté
     indéfiniment — un calque invisible en z-index 100 par-dessus toute
     la page. */
  if (!show) return null;

  return (
    <div
      className={`splash-screen fixed inset-0 z-[100] flex flex-col items-center justify-center bg-cream ${
        leaving ? "splash-out" : ""
      }`}
      /* Jamais cliquable : même si un bug le laissait affiché, il ne
         bloquerait pas l'usage du site. */
      style={{ pointerEvents: "none" }}
      aria-hidden
    >
      <div className="wax-pattern absolute inset-0 opacity-60" />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-splash.png"
        alt=""
        fetchPriority="high"
        className="splash-logo relative w-56 max-w-[65vw]"
      />

      <div className="splash-dots relative mt-8 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-primary"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
