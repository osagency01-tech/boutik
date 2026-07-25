// ============================================================
//  BOUTIK — Edge Function : envoi de la notification push
//  quand une commande arrive.
//
//  Appelée par le trigger Postgres notify_new_order() (voir
//  supabase/migrations/007_push_subscriptions.sql) via pg_net,
//  jamais directement par le client.
//
//  Secrets requis (Supabase → Edge Functions → notify-order → Secrets) :
//    VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY  (générées une fois, jamais
//      régénérées ensuite : sinon tous les abonnements existants
//      deviennent invalides)
//    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY sont déjà fournies
//      automatiquement par la plateforme à chaque fonction.
// ============================================================

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:contact@boutik-app.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

Deno.serve(async (req: Request) => {
  try {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return new Response("VAPID non configuré", { status: 500 });
    }

    const { shop_id, reference, customer_name } = await req.json();
    if (!shop_id) return new Response("shop_id manquant", { status: 400 });

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: subs, error } = await sb
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("shop_id", shop_id);
    if (error) throw error;

    const payload = JSON.stringify({
      title: "Nouvelle commande !",
      body: reference
        ? `Commande ${reference} de ${customer_name ?? "un client"}`
        : "Tu as reçu une nouvelle commande.",
      url: "/dashboard/commandes",
      tag: "commande",
    });

    const results = await Promise.allSettled(
      (subs ?? []).map((s) =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        )
      )
    );

    // Un endpoint qui répond 404/410 est expiré (désinstallation, expiration
    // navigateur) : on le supprime plutôt que de réessayer indéfiniment.
    await Promise.all(
      results.map((r, i) => {
        const statusCode = r.status === "rejected" ? (r.reason as { statusCode?: number })?.statusCode : undefined;
        if (statusCode === 404 || statusCode === 410) {
          return sb.from("push_subscriptions").delete().eq("endpoint", subs![i].endpoint);
        }
        return Promise.resolve();
      })
    );

    return new Response(
      JSON.stringify({ sent: results.filter((r) => r.status === "fulfilled").length }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(String(e), { status: 500 });
  }
});
