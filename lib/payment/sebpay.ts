/* ==================================================================== *
 *  Fournisseur de paiement — SebPay (Mobile Money, Afrique de l'Ouest)
 *
 *  Endpoint  : https://newapi.sebpay.bj/api/v1
 *  Auth      : en-tetes X-Public-Key + X-Secret-Key
 *  Modele    : "collection" — un push USSD est envoye sur le telephone
 *              du client ; la confirmation arrive ensuite par webhook.
 *
 *  SebPay ne fournit pas de secret HMAC pour ses webhooks. On ne fait
 *  donc pas confiance au contenu brut : verifyWebhook filtre, et le
 *  webhook rappelle SebPay (confirmPaid) pour confirmer le paiement.
 * ==================================================================== */

import {
  PLAN_PRICES,
  type CheckoutInput,
  type CheckoutResult,
  type Operator,
  type PaymentProvider,
  type WebhookEvent,
} from "./index";

const BASE_URL = "https://newapi.sebpay.bj/api/v1";

const OPERATOR_TO_SEBPAY: Record<Operator, string> = {
  wave: "WAVE",
  orange: "ORANGE",
  mtn: "MTN",
  moov: "MOOV",
};

const SEBPAY_TO_OPERATOR: Record<string, Operator> = {
  WAVE: "wave",
  ORANGE: "orange",
  MTN: "mtn",
  MOOV: "moov",
};

type SebpayConfig = {
  publicKey: string;
  secretKey: string;
};

export class SebpayProvider implements PaymentProvider {
  readonly name = "sebpay";

  constructor(private cfg: SebpayConfig) {}

  private headers() {
    return {
      "X-Public-Key": this.cfg.publicKey,
      "X-Secret-Key": this.cfg.secretKey,
      "Content-Type": "application/json",
    };
  }

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const amount = PLAN_PRICES[input.plan];

    try {
      const res = await fetch(`${BASE_URL}/collections`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          amount,
          currency: "XOF",
          country: "BJ",
          phone: input.phone,
          operator: OPERATOR_TO_SEBPAY[input.operator] ?? "MTN",
          external_reference: input.idempotencyKey,
          description: `Abonnement ${input.plan}`,
          callback_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.boutik-app.com"}/api/webhooks/paiement`,
        }),
      });

      const data = await res.json().catch(() => ({}));
if (!res.ok) {
        const detail =
          (data && (data.errors || data.detail || data.details)) || null;
        return {
          kind: "error",
          message:
            ((data && (data.message || data.error)) ||
              "Le paiement n'a pas pu etre initie.") +
            (detail ? " — " + JSON.stringify(detail) : ""),
        };
      }

      const reference = data.transaction_id || data.reference || input.idempotencyKey;

      return {
        kind: "ussd_push",
        reference,
        message:
          "Un message vient d'etre envoye sur ton telephone. Compose ton code Mobile Money pour valider le paiement.",
      };
    } catch {
      return {
        kind: "error",
        message: "Connexion au service de paiement impossible. Reessaie.",
      };
    }
  }

  verifyWebhook(rawBody: string): boolean {
    if (!rawBody) return false;
    try {
      const p = JSON.parse(rawBody);
      return Boolean(p && (p.transaction_id || p.reference));
    } catch {
      return false;
    }
  }

  parseWebhook(rawBody: string): WebhookEvent | null {
    let p: any;
    try {
      p = JSON.parse(rawBody);
    } catch {
      return null;
    }

    const status: WebhookEvent["status"] =
      p.status === "success" || p.status === "successful" || p.status === "paid"
        ? "paid"
        : p.status === "failed" || p.status === "cancelled"
          ? "failed"
          : "pending";

    const operatorRaw = (p.customer_network || p.provider || "").toUpperCase();

    return {
      reference: p.transaction_id || p.external_reference || p.reference || "",
      idempotencyKey: p.external_reference ?? p.reference ?? null,
      status,
      amount: Number(p.amount) || 0,
      operator: SEBPAY_TO_OPERATOR[operatorRaw] ?? null,
      raw: p,
    };
  }

  async confirmPaid(transactionId: string): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/collections/${transactionId}`, {
        method: "GET",
        headers: this.headers(),
      });
      if (!res.ok) return false;
      const data = await res.json().catch(() => ({}));
      const s = (data.status || "").toLowerCase();
      return s === "success" || s === "successful" || s === "paid";
    } catch {
      return false;
    }
  }
}