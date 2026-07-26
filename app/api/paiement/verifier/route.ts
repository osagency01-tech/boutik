import { getProvider, PLAN_PRICES, type PlanId } from "@/lib/payment";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/* Vérification active d'un paiement.
   SebPay n'ayant pas de webhook fiable, c'est le front qui appelle
   cette route en boucle après le push USSD. Elle interroge SebPay ;
   si la transaction est approuvée ET que le montant correspond, elle
   crédite la boutique — en lisant le plan EN BASE, jamais du client. */

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

  /* On retrouve l'intention. RLS n'est pas utilisée ici (service_role),
     donc on verifie explicitement que la boutique appartient au vendeur. */
  const { data: intent } = await admin
    .from("payments")
    .select("id, shop_id, plan, amount, status")
    .eq("idempotency_key", reference)
    .maybeSingle();

  if (!intent) {
    return NextResponse.json({ error: "paiement inconnu" }, { status: 404 });
  }

  /* Déjà crédité : on renvoie OK sans réinterroger SebPay. */
  if (intent.status === "success") {
    return NextResponse.json({ status: "success" });
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

  /* Interrogation SebPay. */
  const provider = getProvider();
  const paid = await provider.confirmPaid(reference);

  if (!paid) {
    return NextResponse.json({ status: "pending" });
  }

  /* Vérification du montant : le plan vient de la base, mais on
     revérifie que le tarif attendu correspond bien. */
  const plan = intent.plan as PlanId;
  if (!plan || !(plan in PLAN_PRICES) || intent.amount !== PLAN_PRICES[plan]) {
    return NextResponse.json({ error: "montant incohérent" }, { status: 400 });
  }

  /* Crédit : la boutique passe au plan payé. */
  await admin.from("payments")
    .update({ status: "success", paid_at: new Date().toISOString() })
    .eq("id", intent.id);

  await admin.from("shops")
    .update({ plan, status: "active" })
    .eq("id", intent.shop_id);

  return NextResponse.json({ status: "success", plan });
}