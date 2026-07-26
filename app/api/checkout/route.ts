import { getProvider, makeIdempotencyKey, normalizeMsisdn, PLAN_PRICES, type PlanId } from "@/lib/payment";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/* Création d'une intention de paiement.
   Le montant est fixé ICI, jamais envoyé par le navigateur : sinon
   n'importe qui paierait Premium 1 franc.

   L'intention est enregistrée en base AVANT l'appel a l'agregateur :
   c'est elle qui fait foi quand on verifie le paiement ensuite. SebPay
   n'ayant pas de webhook fiable, la verification est active (polling)
   et lit le plan ICI, jamais dans la reference qui transite dehors. */

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

  let body: { shopId?: string; plan?: string; operator?: string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "requête illisible" }, { status: 400 });
  }

  const plan = body.plan as PlanId;
  if (!plan || !(plan in PLAN_PRICES)) {
    return NextResponse.json({ error: "offre inconnue" }, { status: 400 });
  }

  /* RLS vérifie que la boutique appartient bien à l'appelant. */
  const { data: shop } = await sb
    .from("shops")
    .select("id")
    .eq("id", body.shopId ?? "")
    .maybeSingle();
  if (!shop) {
    return NextResponse.json({ error: "boutique introuvable" }, { status: 403 });
  }

  const provider = getProvider();
  const reference = makeIdempotencyKey(shop.id, plan);

  /* Enregistrement de l'intention, en service_role (le vendeur n'a pas
     le droit d'ecrire dans payments — c'est justement ce qui empeche
     qu'il se crédite lui-meme). */
  const admin = createClient(url, service, { auth: { persistSession: false } });
  await admin.from("payments").insert({
    shop_id: shop.id,
    plan,
    amount: PLAN_PRICES[plan],
    currency: "XOF",
    status: "pending",
    provider: provider.name,
    idempotency_key: reference,
  });

  const result = await provider.createCheckout({
    shopId: shop.id,
    plan,
    operator: (body.operator ?? "mtn") as never,
    phone: normalizeMsisdn(body.phone ?? ""),
    idempotencyKey: reference,
    returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/dashboard/abonnement`,
  });

  /* On renvoie la reference au front : il en a besoin pour interroger
     /api/paiement/verifier. */
  return NextResponse.json({ ...result, reference });
}