import { getProvider } from "@/lib/payment";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/* ------------------------------------------------------------------ *
 *  Webhook de paiement
 *
 *  C'est LE point sensible de toute la plateforme : cette route
 *  décide qui est abonné. Trois protections obligatoires :
 *
 *    1. Signature vérifiée  -> sinon on forge une confirmation
 *    2. Idempotence         -> les agrégateurs rejouent les webhooks
 *    3. service_role côté serveur uniquement -> jamais exposé au client
 * ------------------------------------------------------------------ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  /* service_role contourne RLS : c'est voulu ici (le client n'est
     pas authentifié), et c'est pourquoi cette clé ne doit JAMAIS
     être préfixée NEXT_PUBLIC_. */
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  const raw = await req.text();
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => (headers[k] = v));

  const provider = getProvider();

  /* 1. Signature. On répond 401 sans détail : inutile d'aider
     quelqu'un qui tâtonne. */
  if (!provider.verifyWebhook(raw, headers)) {
    return NextResponse.json({ error: "signature invalide" }, { status: 401 });
  }

  const event = provider.parseWebhook(raw);
  if (!event) {
    return NextResponse.json({ error: "charge utile illisible" }, { status: 400 });
  }

  const sb = admin();
  if (!sb) {
    return NextResponse.json({ error: "backend non configuré" }, { status: 503 });
  }

  /* 2. Idempotence. La colonne payments.idempotency_key est UNIQUE :
     un rejeu échoue à l'insertion, on répond 200 pour que
     l'agrégateur cesse de réessayer. */
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
    /* On trace quand même : un échec répété révèle un problème. */
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

  /* 3. Crédit. L'ordre compte : payment -> subscription -> shop.plan.
     Si une étape casse, on peut rejouer depuis la trace. */
  const [shopId, plan] = (event.idempotencyKey ?? "").split(":");
  if (!shopId || !plan) {
    return NextResponse.json({ error: "référence incomplète" }, { status: 400 });
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

  /* C'est l'abonnement qui pilote le plan, jamais le vendeur :
     guard_shop_privileges refuse toute modification côté client. */
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

/* Un GET sur cette route ne doit rien révéler. */
export async function GET() {
  return NextResponse.json({ error: "méthode non autorisée" }, { status: 405 });
}
