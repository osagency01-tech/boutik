/* ==================================================================== *
 *  Fournisseur de paiement — SebPay (Mobile Money, Afrique de l'Ouest)
 *
 *  Endpoint  : https://newapi.sebpay.bj/api/v1
 *  Auth      : en-tetes X-Public-Key + X-Secret-Key
 *  Modele    : "collection" — un push USSD est envoye sur le telephone
 *              du client. SebPay N'ENVOIE PAS de webhook fiable : la
 *              confirmation se fait en interrogeant l'API (confirmPaid)
 *              via l'external_reference. Statut "approved" = paye.
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

/* Statuts que SebPay considere comme un paiement abouti. */
const PAID_STATUSES = ["approved", "success", "successful", "paid", "completed"];

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

    const payload = {
      amount,
      currency: "XOF",
      country: "BJ",
      phone: input.phone,
      operator: OPERATOR_TO_SEBPAY[input.operator] ?? "MTN",
      external_reference: input.idempotencyKey,
      description: `Abonnement ${input.plan}`,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.boutik-app.com"}/api/webhooks/paiement`,
    };

    try {
      const res = await fetch(`${BASE_URL}/collections`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(payload),
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

      /* SebPay renvoie l'identifiant technique dans data.data.transaction_id.
         On garde l'external_reference comme cle de suivi : c'est elle qui
         permet d'interroger le statut ensuite (confirmPaid). */
      const providerTxId = data?.data?.transaction_id ?? null;

      return {
        kind: "ussd_push",
        reference: input.idempotencyKey,
        providerTxId,
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

    /* Le corps webhook peut etre plat ou imbrique dans data. */
    const body = p?.data ?? p;
    const rawStatus = (body.status || "").toLowerCase();

    const status: WebhookEvent["status"] =
      PAID_STATUSES.includes(rawStatus)
        ? "paid"
        : rawStatus === "failed" || rawStatus === "cancelled" || rawStatus === "declined"
          ? "failed"
          : "pending";

    const operatorRaw = (body.customer_network || body.provider || "").toUpperCase();

    return {
      reference: body.transaction_id || body.external_reference || body.reference || "",
      idempotencyKey: body.external_reference ?? body.reference ?? null,
      status,
      amount: Number(body.amount) || 0,
      operator: SEBPAY_TO_OPERATOR[operatorRaw] ?? null,
      raw: p,
    };
  }

  /* Interroge SebPay sur une transaction. La cle passee est
     l'external_reference (celle du checkout), que l'API accepte
     directement sur GET /collections/{ref}. */
  async confirmPaid(externalReference: string): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/collections/${externalReference}`, {
        method: "GET",
        headers: this.headers(),
      });
      const data = await res.json().catch(() => ({}));
      console.log("[confirmPaid]", res.status, "→", JSON.stringify(data));
      if (!res.ok) return false;
      const s = (data?.data?.status || "").toLowerCase();
      return PAID_STATUSES.includes(s);
    } catch (e) {
      console.log("[confirmPaid] EXCEPTION", String(e));
      return false;
    }
  }
  }
