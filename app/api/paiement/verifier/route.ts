import { getProvider, PLAN_PRICES, type PlanId } from "@/lib/payment";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/* Vérification active d'un paiement.
   SebPay n'ayant pas de webhook fiable, c'est le front qui appelle
   cette route en boucle après le push USSD. Elle interroge SebPay et
   renvoie l'état réel : success / rejected / pending. Le front peut
   ainsi s'arrêter net sur un refus au lieu d'attendre la fin. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) {
    return NextResponse.json({ error: "backend non configuré" }, { status: 503 });
  }

  const auth = req.headers.get("authorization");
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });

  const sb = createClient(url, anon, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });
  const { data: userData } = await sb.auth.getUser();
  if (!userData?.user) {
    return NextResponse.json({ error: "session invalide" }, { status: 401 });
  }

  let body: { reference?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "requête illisible" }, { status: 400 });
  }
  const reference = body.reference;
  if (!reference) {
    return NextResponse.json({ error: "référence manquante" }, { status: 400 });
  }

  const admin = createClient(url, service, { auth: { persistSession: false } });

  const { data: intent } = await admin
    .from("payments")
    .select("id, shop_id, plan, amount, status")
    .eq("idempotency_key", reference)
    .maybeSingle();

  if (!intent) {
    return NextResponse.json({ error: "paiement inconnu" }, { status: 404 });
  }

  /* Déjà crédité : on renvoie OK sans réinterroger SebPay. "paid", pas
     "success" : même vocabulaire que le webhook (app/api/webhooks/
     paiement/route.ts), pour que l'historique de facturation
     (lib/api.ts, fetchPaymentHistory) retrouve ce paiement quel que
     soit le chemin (push USSD ici, ou redirection via le webhook). */
  if (intent.status === "paid") {
    return NextResponse.json({ status: "success", plan: intent.plan });
  }

  /* La boutique visée appartient-elle bien à l'appelant ? */
  const { data: shop } = await sb
    .from("shops")
    .select("id")
    .eq("id", intent.shop_id)
    .maybeSingle();
  if (!shop) {
    return NextResponse.json({ error: "accès refusé" }, { status: 403 });
  }

  /* Interrogation SebPay : statut détaillé. */
  const provider = getProvider();
  const etat = await provider.checkStatus(reference);

  /* Refusé : on marque le paiement échoué et on le dit tout de suite. */
  if (etat === "rejected") {
    await admin.from("payments").update({ status: "failed" }).eq("id", intent.id);
    return NextResponse.json({ status: "rejected" });
  }

  /* Toujours en attente : le front continue son décompte. */
  if (etat !== "paid") {
    return NextResponse.json({ status: "pending" });
  }

  /* Payé : vérification du montant (forcée en nombre) puis crédit. */
  const plan = intent.plan as PlanId;
  if (!plan || !(plan in PLAN_PRICES) || Number(intent.amount) !== PLAN_PRICES[plan]) {
    return NextResponse.json({ error: "montant incohérent" }, { status: 400 });
  }

  await admin.from("payments")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", intent.id);

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  /* Même règle que le webhook : un nouvel abonnement remplace toujours
     le précédent, jamais ne s'y ajoute (sinon plusieurs abonnements
     "active" pour la même boutique, et fetchActiveSubscription() ne
     retrouve le bon que par coïncidence). */
  await admin
    .from("subscriptions")
    .update({ status: "annulee" })
    .eq("shop_id", intent.shop_id)
    .eq("status", "active");

  await admin.from("subscriptions").insert({
    shop_id: intent.shop_id,
    plan,
    status: "active",
    amount: intent.amount,
    current_period_end: periodEnd.toISOString(),
    provider: provider.name,
    provider_ref: reference,
  });

  await admin.from("shops")
    .update({
      plan,
      status: "active",
      published_at: new Date().toISOString(),
      grace_until: null,
      purge_after: null,
    })
    .eq("id", intent.shop_id);

  await admin.from("audit_log").insert({
    shop_id: intent.shop_id,
    action: "payment_received",
    target: plan,
    metadata: { amount: intent.amount, reference },
  });

  return NextResponse.json({ status: "success", plan });
}