import { getProvider, makeIdempotencyKey, normalizeMsisdn, PLAN_PRICES, type PlanId } from "@/lib/payment";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/* Création d'une intention de paiement.
   Le montant est fixé ICI, jamais envoyé par le navigateur : sinon
   n'importe qui paierait Premium 1 franc. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ error: "backend non configuré" }, { status: 503 });
  }

  const auth = req.headers.get("authorization");
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });

  /* On agit AVEC le jeton du vendeur, pas en service_role : les RLS
     s'appliquent, donc il ne peut payer que pour sa propre boutique. */
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
  const result = await provider.createCheckout({
    shopId: shop.id,
    plan,
    operator: (body.operator ?? "wave") as never,
    phone: normalizeMsisdn(body.phone ?? ""),
    idempotencyKey: makeIdempotencyKey(shop.id, plan),
    returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/dashboard/abonnement`,
  });

  return NextResponse.json(result);
}
