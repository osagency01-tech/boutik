import { getProvider, PLAN_PRICES, type PlanId } from "@/lib/payment";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/* ------------------------------------------------------------------ *
 *  Webhook de paiement
 *
 *  C'est LE point sensible de toute la plateforme : cette route
 *  decide qui est abonne. Protections :
 *    1. Filtre du webhook (verifyWebhook)
 *    2. Re-verification serveur -> serveur (confirmPaid) car SebPay
 *       ne signe pas ses webhooks
 *    3. Idempotence
 *    4. service_role cote serveur uniquement
 * ------------------------------------------------------------------ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
  /* SebPay ne signe pas ses webhooks. A defaut de HMAC, on restreint
   l'origine. Laisser SEBPAY_WEBHOOK_IPS vide desactive le filtre :
   pratique en local, a renseigner imperativement en production. */
const SEBPAY_IPS = (process.env.SEBPAY_WEBHOOK_IPS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function callerIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
}
}

export async function POST(req: Request) {
  
  const raw = await req.text();
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => (headers[k] = v));

  const provider = getProvider();

  /* 1. Filtre de base. */
  if (!provider.verifyWebhook(raw, headers)) {
    return NextResponse.json({ error: "requete invalide" }, { status: 401 });
  }

  const event = provider.parseWebhook(raw);
  if (!event) {
    return NextResponse.json({ error: "charge utile illisible" }, { status: 400 });
  }

  /* 2. Re-verification serveur -> serveur (SebPay n'a pas de HMAC :
     on ne croit pas le webhook sur parole, on redemande a l'API). */
  if (event.status === "paid" && typeof (provider as any).confirmPaid === "function") {
    const reallyPaid = await (provider as any).confirmPaid(event.reference);
    if (!reallyPaid) {
      return NextResponse.json({ error: "paiement non confirme" }, { status: 401 });
    }
  }

  const sb = admin();
  if (!sb) {
    return NextResponse.json({ error: "backend non configure" }, { status: 503 });
  }

  /* 3. Idempotence. */
  if (event.idempotencyKey) {
    const { data: seen } = await sb
      .from("payments")
      .select("id")
      .eq("idempotency_key", event.idempotencyKey)
      .maybeSingle();
    if (seen) {
      return NextResponse.json({ ok: true, deja_traite: true });
    }
  }

  if (event.status !== "paid") {
    await sb.from("payments").insert({
      shop_id: null,
      amount: event.amount,
      status: event.status,
      provider: provider.name,
      provider_ref: event.reference,
      idempotency_key: event.idempotencyKey,
      raw_payload: event.raw as never,
    });
    return NextResponse.json({ ok: true });
  }

  /* 4. Credit. payment -> subscription -> shop.plan. */
  const [shopId, plan] = (event.idempotencyKey ?? "").split(":");
  if (!shopId || !plan) {
    return NextResponse.json({ error: "reference incomplete" }, { status: 400 });
  }

  /* Le plan est extrait de la reference, donc d'une chaine qui transite
     par l'agregateur. On ne credite jamais une offre dont le tarif ne
     correspond pas au montant reellement encaisse. */
  if (!(plan in PLAN_PRICES)) {
    return NextResponse.json({ error: "offre inconnue" }, { status: 400 });
  }
  const attendu = PLAN_PRICES[plan as PlanId];
  if (event.amount !== attendu) {
    await sb.from("audit_log").insert({
      shop_id: shopId,
      action: "payment_amount_mismatch",
      target: plan,
      metadata: {
        recu: event.amount,
        attendu,
        reference: event.reference,
      },
    });
    return NextResponse.json({ error: "montant incoherent" }, { status: 400 });
  }

  await sb.from("payments").insert({
    shop_id: shopId,
    amount: event.amount,
    status: "paid",
    provider: provider.name,
    provider_ref: event.reference,
    idempotency_key: event.idempotencyKey,
    paid_at: new Date().toISOString(),
    raw_payload: event.raw as never,
  });

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await sb.from("subscriptions").insert({
    shop_id: shopId,
    plan,
    status: "active",
    amount: event.amount,
    current_period_end: periodEnd.toISOString(),
    provider: provider.name,
    provider_ref: event.reference,
  });

  await sb
    .from("shops")
    .update({
      plan,
      status: "active",
      published_at: new Date().toISOString(),
      grace_until: null,
      purge_after: null,
    })
    .eq("id", shopId);

  await sb.from("audit_log").insert({
    shop_id: shopId,
    action: "payment_received",
    target: plan,
    metadata: { amount: event.amount, reference: event.reference },
  });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ error: "methode non autorisee" }, { status: 405 });
}