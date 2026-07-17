/* ==================================================================== *
 *  PAIEMENT — couche d'abstraction
 *
 *  Objectif : brancher un agrégateur en remplissant UN fichier, sans
 *  toucher aux écrans. Le reste du code ne connaît que l'interface
 *  ci-dessous, jamais le fournisseur.
 *
 *  Pourquoi cette indirection : les agrégateurs Mobile Money ouest-
 *  africains changent de conditions, de couverture pays et parfois
 *  disparaissent. Il faut pouvoir en changer sans réécrire l'app.
 *
 *  ⚠️ Ce fichier n'est PAS "use client" : le secret d'API et la
 *  vérification de signature ne doivent jamais atteindre le navigateur.
 * ==================================================================== */

export type Operator = "wave" | "orange" | "mtn" | "moov";

export const OPERATORS: { id: Operator; label: string; countries: string[] }[] = [
  { id: "wave", label: "Wave", countries: ["CI", "SN", "ML", "BF"] },
  { id: "orange", label: "Orange Money", countries: ["CI", "SN", "ML", "BF", "CM"] },
  { id: "mtn", label: "MTN MoMo", countries: ["CI", "BJ", "CM", "GH"] },
  { id: "moov", label: "Moov Money", countries: ["CI", "BJ", "TG", "BF"] },
];

export type PlanId = "starter" | "business" | "premium";

/* Les prix vivent ici, pas dans l'interface : un tarif ne doit
   jamais être fixé par le navigateur. */
export const PLAN_PRICES: Record<PlanId, number> = {
  starter: 999,
  business: 1999,
  premium: 4999,
};

export type CheckoutInput = {
  shopId: string;
  plan: PlanId;
  operator: Operator;
  /* Numéro à débiter, format international sans + */
  phone: string;
  /* Clé d'idempotence : protège contre le double-clic ET le rejeu
     de webhook. Générée par l'appelant, stockée en base. */
  idempotencyKey: string;
  returnUrl: string;
};

export type CheckoutResult =
  | { kind: "redirect"; url: string; reference: string }
  /* Certains agrégateurs poussent un USSD sur le téléphone :
     rien à afficher, on attend le webhook. */
  | { kind: "ussd_push"; reference: string; message: string }
  | { kind: "error"; message: string };

export type WebhookEvent = {
  reference: string;
  idempotencyKey: string | null;
  status: "paid" | "failed" | "pending";
  amount: number;
  operator: Operator | null;
  raw: unknown;
};

/* -------------------------------------------------------------------- *
 * Interface que tout fournisseur doit remplir
 * -------------------------------------------------------------------- */

export interface PaymentProvider {
  readonly name: string;

  /** Crée une intention de paiement. */
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;

  /**
   * Vérifie la signature du webhook.
   *
   * NON NÉGOCIABLE : sans cette vérification, n'importe qui peut
   * POSTer une fausse confirmation de paiement et s'abonner
   * gratuitement à Premium. Un fournisseur qui ne signe pas ses
   * webhooks ne doit pas être utilisé.
   */
  verifyWebhook(rawBody: string, headers: Record<string, string>): boolean;

  /** Traduit la charge utile du fournisseur vers notre format. */
  parseWebhook(rawBody: string): WebhookEvent | null;
}

/* -------------------------------------------------------------------- *
 * Fournisseur factice — actif tant qu'aucun agrégateur n'est branché
 *
 * Permet de dérouler tout le parcours (écrans, base, statuts) sans
 * argent réel. Refuse catégoriquement de tourner en production.
 * -------------------------------------------------------------------- */

class MockProvider implements PaymentProvider {
  readonly name = "mock";

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    if (process.env.NODE_ENV === "production") {
      return {
        kind: "error",
        message:
          "Aucun agrégateur de paiement n'est configuré. Voir lib/payment/README.md",
      };
    }
    return {
      kind: "ussd_push",
      reference: "MOCK-" + input.idempotencyKey.slice(0, 8),
      message:
        "Mode démo : aucun paiement réel. Passe le plan à la main en base pour tester la suite.",
    };
  }

  verifyWebhook(): boolean {
    /* Toujours faux : un mock ne doit jamais valider un paiement. */
    return false;
  }

  parseWebhook(): WebhookEvent | null {
    return null;
  }
}

/* -------------------------------------------------------------------- *
 * >>> POINT DE BRANCHEMENT <<<
 *
 * Quand tu auras choisi ton agrégateur :
 *
 *   1. Crée lib/payment/<nom>.ts qui implémente PaymentProvider
 *   2. Importe-le ici et retourne-le dans getProvider()
 *   3. Renseigne les variables d'environnement (jamais NEXT_PUBLIC_*)
 *
 * Rien d'autre à modifier dans l'application.
 * -------------------------------------------------------------------- */

let cached: PaymentProvider | null = null;

export function getProvider(): PaymentProvider {
  if (cached) return cached;

  const which = process.env.PAYMENT_PROVIDER ?? "mock";

  switch (which) {
    /* Exemple, à décommenter le moment venu :
     *
     * case "kkiapay":
     *   cached = new KkiapayProvider({
     *     publicKey:  process.env.KKIAPAY_PUBLIC_KEY!,
     *     privateKey: process.env.KKIAPAY_PRIVATE_KEY!,
     *     secret:     process.env.KKIAPAY_SECRET!,
     *   });
     *   break;
     */
    default:
      cached = new MockProvider();
  }
  return cached;
}

/* -------------------------------------------------------------------- *
 * Utilitaires communs
 * -------------------------------------------------------------------- */

/** Numéro en format international sans +, borné. */
export function normalizeMsisdn(phone: string, countryCode = "225"): string {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith(countryCode)) return d.slice(0, 15);
  return (countryCode + d.replace(/^0+/, "")).slice(0, 15);
}

/** Clé d'idempotence : un double-clic ne doit jamais débiter deux fois. */
export function makeIdempotencyKey(shopId: string, plan: PlanId): string {
  /* Fenêtre d'une minute : deux clics rapprochés produisent la même
     clé, deux paiements volontaires à une minute d'écart non. */
  const minute = Math.floor(Date.now() / 60000);
  return `${shopId}:${plan}:${minute}`;
}

/**
 * Comparaison à temps constant.
 * Un `===` classique s'arrête au premier caractère différent : le temps
 * de réponse révèle alors combien de caractères sont corrects, ce qui
 * permet de reconstruire une signature. Rare, mais gratuit à éviter.
 */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
