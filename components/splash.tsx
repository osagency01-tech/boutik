"use client";

import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ *
 * Écran de démarrage Boutik
 *
 * Le mot "Boutik" (police Breathing, vert) se révèle de gauche à
 * droite comme tracé à la main, puis respire doucement. Affiché une
 * fois par session (pas à chaque navigation) : passé la première fois,
 * c'est une perte de temps pour le vendeur qui revient souvent.
 * ------------------------------------------------------------------ */

const SEEN_KEY = "boutik-splash-seen";

export default function Splash() {
  /* Lu une seule fois, avant que ce composant n'écrive quoi que ce soit :
     capture l'état du sessionStorage tel qu'il était AVANT ce montage.
     Important en développement (React Strict Mode) : l'effet ci-dessous
     est monté, nettoyé puis remonté délibérément. Si on relisait
     sessionStorage directement dans l'effet, le premier passage marquait
     "vu" avant même que le second ne s'exécute — le second se croyait
     alors déjà affiché, ne relançait pas les minuteurs, et le splash
     restait bloqué à l'écran pour de bon (le premier jeu de minuteurs
     ayant été annulé par le nettoyage du premier passage). */
  const [alreadySeen] = useState(() => {
    try {
      return sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      /* navigation privée : on n'insiste pas */
      return true;
    }
  });
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (alreadySeen) return;

    setShow(true);
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {}

    /* Deux temps : on lance le fondu de sortie, puis on démonte.
       2,6 s d'affichage : le mot s'écrit (1,1 s), puis respire un
       bon moment (démarre à 1,2 s) avant de s'effacer — assez pour
       voir le mouvement, sans faire croire que la page est bloquée
       derrière un écran blanc plein cadre. */
    const t1 = setTimeout(() => setLeaving(true), 2600);
    const t2 = setTimeout(() => {
      setShow(false);
      setLeaving(false);
    }, 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [alreadySeen]);

  if (!show) return null;

  return (
    <div
      className={`splash-screen fixed inset-0 z-[100] flex items-center justify-center bg-white ${
        leaving ? "splash-out" : ""
      }`}
      style={{ pointerEvents: "none" }}
      aria-hidden
    >
      {/* Le mot, avec la pulsation douce */}
      <div className="splash-word-wrap">
        <span className="splash-word">Boutik</span>
        {/* Masque blanc qui se retire de gauche à droite */}
        <span className="splash-reveal" />
      </div>
    </div>
  );
}