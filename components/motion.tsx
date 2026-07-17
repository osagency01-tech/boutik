"use client";

import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ *
 * Animations d'apparition — sans dépendance
 *
 * Ces composants sont utilisés sur presque chaque page. Ils faisaient
 * appel à Framer Motion (~115 Ko) pour un simple fondu + glissement
 * au scroll. IntersectionObserver + une transition CSS font la même
 * chose en ~1 Ko, et l'animation tourne sur le compositeur du
 * navigateur — donc plus fluide sur un téléphone d'entrée de gamme.
 *
 * Framer Motion reste utilisé là où il apporte vraiment quelque chose :
 * le glissement au doigt du téléphone de la landing, et les modales.
 * ------------------------------------------------------------------ */

const EASE = "cubic-bezier(0.21, 0.6, 0.35, 1)";

/** Respecte le réglage système « réduire les animations ». */
function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const on = () => setReduce(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduce;
}

/** Se déclenche une seule fois, quand l'élément entre dans l'écran. */
function useInView<T extends HTMLElement>(margin = "-60px") {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;

    /* Navigateur ancien : on affiche sans animer plutôt que de
       laisser le contenu invisible. */
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          obs.disconnect();
        }
      },
      { rootMargin: margin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [seen, margin]);

  return { ref, seen };
}

export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const { ref, seen } = useInView<HTMLDivElement>();
  const reduce = usePrefersReducedMotion();

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: reduce || seen ? 1 : 0,
        transform: reduce || seen ? "none" : `translateY(${y}px)`,
        transition: reduce
          ? undefined
          : `opacity .6s ${EASE} ${delay}s, transform .6s ${EASE} ${delay}s`,
        /* Prévient le compositeur : évite le scintillement sur mobile */
        willChange: seen ? undefined : "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

/* Contexte minimal pour que StaggerItem connaisse son rang sans
   que l'appelant ait à le passer. */
let staggerIndex = 0;

export function Stagger({
  children,
  className,
  gap = 0.08,
}: {
  children: React.ReactNode;
  className?: string;
  gap?: number;
}) {
  const { ref, seen } = useInView<HTMLDivElement>();
  const reduce = usePrefersReducedMotion();
  staggerIndex = 0;

  return (
    <div
      ref={ref}
      className={className}
      data-stagger={seen ? "in" : "out"}
      style={
        {
          "--stagger-gap": `${reduce ? 0 : gap}s`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [i] = useState(() => staggerIndex++);

  return (
    <div
      className={`stagger-item ${className ?? ""}`}
      style={{ "--stagger-i": i } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
