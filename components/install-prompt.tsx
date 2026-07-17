"use client";

import { Bell, BellRing, Check, Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ *
 * Installation PWA
 *
 * Un vendeur qui installe l'app revient. Celui qui garde un onglet
 * ouvert l'oublie en deux jours. C'est probablement le levier de
 * rétention le plus fort du produit — et il coûte un bandeau.
 *
 * Deux chemins très différents :
 *   - Android/Chrome : l'événement beforeinstallprompt donne un
 *     vrai bouton « Installer ».
 *   - iOS/Safari : aucune API. Il FAUT expliquer le geste
 *     (Partager → Sur l'écran d'accueil), sinon personne ne le
 *     devine.
 * ------------------------------------------------------------------ */

const DISMISS_KEY = "boutik-install-refuse";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const isIOS = () =>
  typeof navigator !== "undefined" &&
  /iphone|ipad|ipod/i.test(navigator.userAgent) &&
  !/crios|fxios/i.test(navigator.userAgent);

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error — propriété propre à iOS
    window.navigator.standalone === true);

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    /* Déjà installé, ou déjà refusé : on n'insiste pas. */
    if (isStandalone()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {}

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    /* iOS n'émet jamais l'événement : on affiche l'aide manuelle,
       mais après un délai — proposer d'installer avant même d'avoir
       vu le produit est absurde. */
    if (isIOS()) {
      const t = setTimeout(() => setShow(true), 25000);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onPrompt);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    setShow(false);
    setShowIosHelp(false);
  };

  const install = async () => {
    if (isIOS()) {
      setShowIosHelp(true);
      return;
    }
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") dismiss();
    setShow(false);
  };

  return (
    <>
      {show && !showIosHelp && (
        <div className="animate-slide-up fixed inset-x-3 bottom-20 z-50 lg:bottom-4 lg:left-auto lg:right-4 lg:w-80">
            <div className="flex items-start gap-3 rounded-2xl bg-ink p-4 text-white shadow-lift">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon-192.png"
                alt=""
                className="h-11 w-11 shrink-0 rounded-xl"
              />
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-extrabold">
                  Installe Boutik sur ton téléphone
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-white/60">
                  Ouvre ta boutique en un geste, et reçois tes commandes même
                  l&apos;application fermée.
                </p>
                <div className="mt-3 flex gap-2">
                  <button onClick={install} className="btn bg-mango px-4 py-1.5 text-xs font-bold text-ink hover:bg-white">
                    <Download size={13} /> Installer
                  </button>
                  <button
                    onClick={dismiss}
                    className="btn px-3 py-1.5 text-xs font-semibold text-white/50 hover:text-white"
                  >
                    Plus tard
                  </button>
                </div>
              </div>
              <button
                onClick={dismiss}
                className="shrink-0 rounded-full p-1 text-white/35 hover:text-white"
                aria-label="Fermer"
              >
                <X size={15} />
              </button>
          </div>
        </div>
      )}

      {/* iOS : le geste doit être montré, il n'est pas devinable */}
      {showIosHelp && (
        <div
          onClick={dismiss}
          className="animate-fade fixed inset-0 z-[80] flex items-end justify-center bg-ink/60 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-slide-up w-full max-w-sm rounded-t-3xl bg-white p-6 text-center sm:rounded-3xl"
          >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-192.png" alt="" className="mx-auto h-14 w-14 rounded-2xl" />
              <h3 className="mt-4 font-display text-lg font-extrabold">
                Ajouter à l&apos;écran d&apos;accueil
              </h3>
              <p className="mt-1.5 text-sm text-ink/55">Deux gestes, dans Safari :</p>

              <div className="mt-5 space-y-3 text-left">
                <div className="flex items-center gap-3 rounded-xl bg-cream p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-primary">
                    <Share size={16} />
                  </span>
                  <p className="text-sm">
                    <span className="font-bold">1.</span> Appuie sur{" "}
                    <span className="font-bold">Partager</span> en bas de l&apos;écran
                  </p>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-cream p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-primary">
                    <span className="text-lg leading-none">+</span>
                  </span>
                  <p className="text-sm">
                    <span className="font-bold">2.</span> Choisis{" "}
                    <span className="font-bold">Sur l&apos;écran d&apos;accueil</span>
                  </p>
                </div>
              </div>

            <button onClick={dismiss} className="btn-primary btn-md mt-5 w-full">
              J&apos;ai compris
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Notifications push
 *
 * Une commande ratée est une vente perdue. Mais on ne demande la
 * permission QU'APRÈS une action qui la justifie — un navigateur
 * qui demande dès l'arrivée se fait refuser, et le refus est
 * définitif : on ne peut plus jamais redemander.
 * ------------------------------------------------------------------ */

export function NotificationCard() {
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPerm("unsupported");
      return;
    }
    setPerm(Notification.permission);
  }, []);

  const ask = async () => {
    setBusy(true);
    try {
      const res = await Notification.requestPermission();
      setPerm(res);
      if (res === "granted") {
        /* Confirmation immédiate : le vendeur doit voir que ça marche,
           sinon il ne saura jamais si c'est actif. */
        new Notification("Notifications activées", {
          body: "Tu seras prévenu dès qu'une commande arrive.",
          icon: "/icon-192.png",
        });

        /* L'abonnement push réel (VAPID + service worker) se branche
           ici quand le serveur d'envoi sera prêt. La permission, elle,
           est bien acquise dès maintenant. */
        if ("serviceWorker" in navigator) {
          await navigator.serviceWorker.ready.catch(() => {});
        }
      }
    } catch {
      /* Safari lève si l'appel n'est pas dans un geste utilisateur */
    }
    setBusy(false);
  };

  if (perm === "unsupported" || perm === "granted") return null;

  return (
    <div className="card flex items-start gap-3 p-4">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          perm === "denied" ? "bg-ink/5 text-ink/35" : "bg-mango-soft text-yellow-700"
        }`}
      >
        {perm === "denied" ? <Bell size={18} /> : <BellRing size={18} />}
      </span>

      <div className="min-w-0 flex-1">
        {perm === "denied" ? (
          <>
            <p className="text-sm font-bold">Notifications bloquées</p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink/50">
              Tu ne seras pas prévenu des nouvelles commandes. Pour réactiver : appuie sur
              l&apos;icône à gauche de l&apos;adresse du site → Notifications → Autoriser.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-bold">Sois prévenu de tes commandes</p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink/50">
              Reçois une alerte dès qu&apos;un client commande, même l&apos;application
              fermée.
            </p>
            <button onClick={ask} disabled={busy} className="btn-primary btn-sm mt-3">
              {busy ? "…" : <BellRing size={13} />} Activer
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* Bandeau de confirmation, une fois actif */
export function NotificationsActive() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window)
      setOk(Notification.permission === "granted");
  }, []);
  if (!ok) return null;
  return (
    <span className="chip bg-primary-soft text-primary-dark">
      <Check size={11} /> Notifications actives
    </span>
  );
}
