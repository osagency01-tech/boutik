import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import webpush from "web-push";

/* ------------------------------------------------------------------ *
 *  Notification push envoyée par l'admin à tous les vendeurs abonnés
 *  (promotions, annonces...) — distincte de notify-order (Edge
 *  Function Deno, déclenchée par le trigger DB à chaque commande) :
 *  celle-ci est déclenchée par une action humaine dans le dashboard
 *  admin, donc une route Next.js classique suffit, sans passer par
 *  pg_net ni déployer une seconde Edge Function.
 * ------------------------------------------------------------------ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!url || !anon || !serviceKey) {
    return NextResponse.json({ error: "backend non configuré" }, { status: 503 });
  }
  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json({ error: "VAPID non configuré" }, { status: 503 });
  }

  const auth = req.headers.get("authorization");
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });

  /* Vérifie l'admin AVEC le jeton de l'appelant (RLS : un vendeur ne
     peut lire que son propre profil — "profil : lecture de soi",
     002_rls.sql). Seule la lecture des abonnements push et l'envoi
     lui-même utilisent service_role, plus bas. */
  const sbUser = createClient(url, anon, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });
  const { data: userData } = await sbUser.auth.getUser();
  if (!userData?.user) {
    return NextResponse.json({ error: "session invalide" }, { status: 401 });
  }
  const { data: profile } = await sbUser
    .from("profiles")
    .select("is_admin")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (!profile?.is_admin) {
    return NextResponse.json({ error: "réservé aux admins" }, { status: 403 });
  }

  let body: { title?: string; message?: string; url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "requête illisible" }, { status: 400 });
  }
  const title = (body.title ?? "").trim().slice(0, 80);
  const message = (body.message ?? "").trim().slice(0, 200);
  if (!title || !message) {
    return NextResponse.json({ error: "titre et message requis" }, { status: 400 });
  }
  const targetUrl = body.url?.trim() || "/dashboard";

  webpush.setVapidDetails("mailto:contact@boutik-app.com", vapidPublic, vapidPrivate);

  const sbAdmin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: subs, error } = await sbAdmin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth");
  if (error) {
    return NextResponse.json({ error: "lecture des abonnements impossible" }, { status: 500 });
  }

  const payload = JSON.stringify({ title, body: message, url: targetUrl, tag: "annonce" });

  const results = await Promise.allSettled(
    (subs ?? []).map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      )
    )
  );

  /* Un endpoint qui répond 404/410 est expiré : on le supprime plutôt
     que de réessayer indéfiniment à la prochaine annonce. */
  await Promise.all(
    results.map((r, i) => {
      const statusCode =
        r.status === "rejected" ? (r.reason as { statusCode?: number })?.statusCode : undefined;
      if (statusCode === 404 || statusCode === 410) {
        return sbAdmin.from("push_subscriptions").delete().eq("endpoint", subs![i].endpoint);
      }
      return Promise.resolve();
    })
  );

  return NextResponse.json({
    sent: results.filter((r) => r.status === "fulfilled").length,
    total: subs?.length ?? 0,
  });
}

export async function GET() {
  return NextResponse.json({ error: "méthode non autorisée" }, { status: 405 });
}
