"use client";

import { useEffect } from "react";

/* Enregistre le service worker : sans lui, pas d'installation
   possible ni de notification push. */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    /* Après le chargement : l'enregistrement ne doit pas concurrencer
       le rendu initial sur une connexion lente. */
    const t = setTimeout(() => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* Échoue en dev sur certains navigateurs : sans conséquence */
      });
    }, 2000);
    return () => clearTimeout(t);
  }, []);
  return null;
}
