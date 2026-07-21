/* ==================================================================== *
 *  PAIEMENT — couche d'abstraction
 * ==================================================================== */

export type Operator = "wave" | "orange" | "mtn" | "moov";

import { SebpayProvider } from "./sebpay";

export const OPERATORS: { id: Operator; label: string; countries: string[] }[] = [
  { id: "wave", label: "Wave", countries: ["CI", "SN", "ML", "BF"] },
  { id: "orange", label: "Orange Money", countries: ["CI", "SN", "ML", "BF", "CM"] },
  { id: "mtn", label: "MTN MoMo", countries: ["CI", "BJ", "CM", "GH"] },
  { id: "moov", label: "Moov Money", countries: ["CI", "BJ", "TG", "BF"] },
];

export type PlanId = "starter" | "business" | "premium";

export const PLAN_PRICES: Record<PlanId, number> = {
  starter: 999,
  business: 1999,
  premium: 4999,
};

export type CheckoutInput = {
  shopId: string;
  plan: PlanId;
  operator: Operator;
  phone: string;
  idempotencyKey: string;
  returnUrl: string;
};

export type CheckoutResult =
  | { kind: "redirect"; url: string; reference: string }
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

export interface PaymentProvider {
  readonly name: string;
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  verifyWebhook(rawBody: string, headers: Record<string, string>): boolean;
  parseWebhook(rawBody: string): WebhookEvent | null;
}

/* -------------------------------------------------------------------- *
 * Fournisseur factice — actif tant qu'aucun agrégateur n'est branché
 * -------------------------------------------------------------------- */

class MockProvider implements PaymentProvider {
  readonly name = "mock";

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    if (process.env.NODE_ENV === "production") {
      return {
        kind: "error",
        message:
          "Aucun agregateur de paiement n'est configure. Voir lib/payment/README.md",
      };
    }
    return {
      kind: "ussd_push",
      reference: "MOCK-" + input.idempotencyKey.slice(0, 8),
      message:
        "Mode demo : aucun paiement reel. Passe le plan a la main en base pour tester la suite.",
    };
  }

  verifyWebhook(): boolean {
    return false;
  }

  parseWebhook(): WebhookEvent | null {
    return null;
  }
}

/* -------------------------------------------------------------------- *
 * Point de branchement
 * -------------------------------------------------------------------- */

let cached: PaymentProvider | null = null;

export function getProvider(): PaymentProvider {
  if (cached) return cached;

  const which = process.env.PAYMENT_PROVIDER ?? "mock";

  switch (which) {
    case "sebpay": {
      const publicKey = process.env.SEBPAY_PUBLIC_KEY;
      const secretKey = process.env.SEBPAY_SECRET_KEY;
      if (!publicKey || !secretKey) {
        cached = new MockProvider();
        break;
      }
      cached = new SebpayProvider({ publicKey, secretKey });
      break;
    }
    default:
      cached = new MockProvider();
  }
  return cached;
}

/* -------------------------------------------------------------------- *
 * Utilitaires communs
 * -------------------------------------------------------------------- */

export function normalizeMsisdn(phone: string, countryCode = "229"): string {
  const d = phone.replace(/\D/g, "");
  /* Déjà au format international (commence par l'indicatif). */
  if (d.startsWith(countryCode)) return d.slice(0, 15);
  /* Bénin : les numéros à 10 chiffres commencent par 01 — ce 0 fait
     partie du numéro, on ne le retire PAS. On préfixe juste l'indicatif. */
  return (countryCode + d).slice(0, 15);
}

export function makeIdempotencyKey(shopId: string, plan: PlanId): string {
  const minute = Math.floor(Date.now() / 60000);
  return `${shopId}:${plan}:${minute}`;
}

export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}