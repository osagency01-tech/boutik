"use client";

import * as api from "./api";

/* ------------------------------------------------------------------ *
 * Abonnement Push — partagé entre le guide de démarrage
 * (components/onboarding.tsx) et la carte de notification
 * (components/install-prompt.tsx) : même geste, un seul endroit
 * où le corriger.
 * ------------------------------------------------------------------ */

/* L'API Push attend la clé VAPID en Uint8Array, pas en base64url brut. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64safe);
  return Uint8Array.from(Array.from(raw).map((c) => c.charCodeAt(0)));
}

/* Abonne ce navigateur aux notifications push de la boutique et
   enregistre l'abonnement en base. En mode démo (pas de Supabase),
   la permission navigateur suffit — il n'y a rien à persister. */
export async function subscribeToPush(shopId: string | null, demoMode: boolean): Promise<boolean> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !publicKey) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    let sub = await registration.pushManager.getSubscription();
    if (!sub) {
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
    }
    if (!demoMode && shopId) {
      await api.savePushSubscription(shopId, sub.toJSON());
    }
    return true;
  } catch {
    /* Navigateur qui refuse l'abonnement (ex. Firefox sans réseau push) :
       la permission reste acquise, seule la réception réelle échoue. */
    return false;
  }
}
