"use client";

/* ==================================================================== *
 *  SÉCURITÉ — point central
 *
 *  Ce fichier regroupe les protections applicatives. Il complète —
 *  il ne remplace pas — les deux barrières qui comptent vraiment :
 *
 *    1. Les policies RLS en base (supabase/migrations/002_rls.sql)
 *       C'est la SEULE protection qu'un développeur ne peut pas
 *       oublier dans un refactor.
 *    2. Les en-têtes HTTP (next.config.mjs)
 *
 *  Tout ce qui est ici tourne dans le navigateur : un attaquant peut
 *  le contourner. C'est une couche de confort et de propreté des
 *  données, pas un rempart. Ne JAMAIS s'y fier seul.
 * ==================================================================== */

/* -------------------------------------------------------------------- *
 * 1. Validation et nettoyage des entrées
 * -------------------------------------------------------------------- */

/** Retire les caractères de contrôle et normalise les espaces. */
export function cleanText(v: string, maxLen = 500): string {
  return v
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

/** Texte multiligne : on garde les sauts de ligne, on borne leur nombre. */
export function cleanMultiline(v: string, maxLen = 2000): string {
  return v
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim()
    .slice(0, maxLen);
}

export const isEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) && v.length <= 120;

/** Numéro en chiffres uniquement, longueur plausible. */
export const isPhone = (v: string) => {
  const d = v.replace(/\D/g, "");
  return d.length >= 8 && d.length <= 15;
};

export const normalizePhone = (v: string) => v.replace(/\D/g, "").slice(0, 15);

/**
 * Un slug de boutique devient un sous-domaine : il ne doit jamais
 * pouvoir contenir de point (sous-domaine imbriqué) ni de caractère
 * d'échappement d'URL.
 */
export function safeSlug(v: string): string {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 30);
}

/**
 * N'accepte que http(s). Bloque javascript:, data:, vbscript: —
 * un lien Instagram saisi par un vendeur ne doit pas pouvoir
 * exécuter du script chez ses clients.
 */
export function safeUrl(v: string): string | null {
  const t = v.trim();
  if (!t) return null;
  try {
    const u = new URL(t.startsWith("http") ? t : `https://${t}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** Un montant doit être un entier positif borné : pas de NaN, pas d'Infinity. */
export function safeAmount(v: unknown, max = 100_000_000): number {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
}

/* -------------------------------------------------------------------- *
 * 2. Assainissement des sorties
 *
 * React échappe déjà tout ce qu'il rend : le risque XSS classique
 * n'existe pas ici. Le danger restant est ailleurs — dans les
 * chaînes qu'on injecte dans des URL.
 * -------------------------------------------------------------------- */

/**
 * Une commande part sur WhatsApp via wa.me?text=...
 * Sans encodage strict, un nom de produit contenant &, # ou un retour
 * chariot casserait le message — ou permettrait d'y injecter du texte.
 */
export function safeWhatsAppText(text: string): string {
  return encodeURIComponent(text.slice(0, 1800));
}

/** Numéro pour wa.me : chiffres seuls, jamais de caractère d'URL. */
export function safeWhatsAppNumber(phone: string): string {
  return phone.replace(/\D/g, "").slice(0, 15);
}

/* -------------------------------------------------------------------- *
 * 3. Vérification des fichiers
 *
 * L'extension ment. On lit les octets d'en-tête (magic bytes) :
 * un .php renommé .jpg est rejeté ici, et Supabase Storage le
 * rejette aussi côté serveur (allowed_mime_types).
 * -------------------------------------------------------------------- */

const MAGIC: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // "RIFF" + WEBP en offset 8
};

export async function isRealImage(file: File): Promise<boolean> {
  if (file.size > 8 * 1024 * 1024) return false; // 8 Mo max
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  for (const sigs of Object.values(MAGIC)) {
    for (const sig of sigs) {
      if (sig.every((b, i) => head[i] === b)) {
        // WebP : vérifier aussi le marqueur en offset 8
        if (sig[0] === 0x52) {
          const webp = [0x57, 0x45, 0x42, 0x50];
          return webp.every((b, i) => head[8 + i] === b);
        }
        return true;
      }
    }
  }
  return false;
}

/* -------------------------------------------------------------------- *
 * 4. Limitation de débit (côté client)
 *
 * Le vrai rate limit est chez Supabase (auth) et en base
 * (guard_message_flood). Celui-ci évite juste qu'un vendeur
 * impatient épuise son quota en martelant un bouton.
 * -------------------------------------------------------------------- */

const hits = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= max) return false;
  list.push(now);
  hits.set(key, list);
  return true;
}

/* -------------------------------------------------------------------- *
 * 5. Chiffrement du stockage local
 *
 * Contre quoi ça protège : un script tiers ou une extension qui
 * lirait localStorage en clair.
 * Contre quoi ça NE protège PAS : quelqu'un qui a la main sur
 * l'appareil — la clé est dans la même page. C'est de l'obfuscation
 * sérieuse, pas un coffre-fort. Les vraies données sensibles
 * (commandes, clients) restent en base, protégées par RLS.
 * -------------------------------------------------------------------- */

const STORE_KEY = "boutik-sk";

async function getKey(): Promise<CryptoKey | null> {
  if (typeof window === "undefined" || !window.crypto?.subtle) return null;
  try {
    let raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      raw = btoa(String.fromCharCode.apply(null, Array.from(bytes)));
      localStorage.setItem(STORE_KEY, raw);
    }
    const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
    return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, [
      "encrypt",
      "decrypt",
    ]);
  } catch {
    return null;
  }
}

export async function secureSet(key: string, value: unknown): Promise<void> {
  const k = await getKey();
  const json = JSON.stringify(value);
  if (!k) {
    localStorage.setItem(key, json); // dégradation propre
    return;
  }
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(json);
  const buf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k, data);
  const out = new Uint8Array(iv.length + buf.byteLength);
  out.set(iv);
  out.set(new Uint8Array(buf), iv.length);
  localStorage.setItem(
    key,
    "enc:" + btoa(String.fromCharCode.apply(null, Array.from(out)))
  );
}

export async function secureGet<T>(key: string): Promise<T | null> {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  if (!raw.startsWith("enc:")) {
    try {
      return JSON.parse(raw) as T; // ancien format non chiffré
    } catch {
      return null;
    }
  }
  const k = await getKey();
  if (!k) return null;
  try {
    const bytes = Uint8Array.from(atob(raw.slice(4)), (c) => c.charCodeAt(0));
    const iv = bytes.slice(0, 12);
    const buf = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      k,
      bytes.slice(12)
    );
    return JSON.parse(new TextDecoder().decode(buf)) as T;
  } catch {
    return null; // clé changée ou données corrompues
  }
}

/* -------------------------------------------------------------------- *
 * 6. Détection de contenu interdit (§15 du CDC)
 *
 * Filet grossier, volontairement : il attrape les cas évidents et
 * signale à la modération. Il ne remplace pas un humain — un
 * dictionnaire ne détectera jamais une contrefaçon en photo.
 * -------------------------------------------------------------------- */

const BANNED = [
  "cocaine", "heroine", "heroin", "kalachnikov", "ak-47", "ak47",
  "faux billet", "faux billets", "faux passeport", "faux diplome",
  "arme a feu", "munition", "ivoire elephant", "ecaille pangolin",
  "viagra", "tramadol", "cannabis", "chanvre indien",
];

export function flagContent(text: string): string | null {
  const t = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const found = BANNED.find((w) => t.includes(w));
  return found ?? null;
}

/* -------------------------------------------------------------------- *
 * 7. Journal d'anomalies
 *
 * En production, à relier à un vrai collecteur. Ici on garde une
 * trace locale : suffisant pour repérer un comportement anormal
 * pendant les tests.
 * -------------------------------------------------------------------- */

export function logSecurityEvent(kind: string, detail?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[sécurité] ${kind}`, detail ?? "");
  }
  /* En prod : POST vers /api/security-log, ou Sentry. */
}
