"use client";

import { Reveal } from "@/components/motion";
import { PLANS, fcfa } from "@/lib/data";
import { PLAN_QUOTA, useStore, type Plan } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, Clock, CreditCard, Info, Loader2, Receipt, X } from "lucide-react";
import { useState } from "react";

/* ------------------------------------------------------------------ *
 * Abonnement
 *
 * Tout est prêt côté écran. Le branchement de l'agrégateur Mobile
 * Money se fait dans `startCheckout()` — c'est le seul endroit à
 * remplir. Le reste (offres, quotas, échéance, factures) fonctionne.
 * ------------------------------------------------------------------ */

export default function SubscriptionPage() {
  const { config, products, palette } = useStore();
  const [selected, setSelected] = useState<Plan | null>(null);

  const quota = PLAN_QUOTA[config.plan];
  const used = products.length;

  return (
    <div>
      <Reveal>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Mon abonnement</h1>
        <p className="mt-1 text-sm text-ink/55">
          Ton offre, ta facturation et tes paiements.
        </p>
      </Reveal>

      {/* --- Offre en cours --- */}
      <Reveal delay={0.06}>
        <div className="card mt-5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink/45">
                Offre en cours
              </p>
              <p className="mt-1 font-display text-2xl font-extrabold">{config.plan}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-ink/55">
                <span
                  className={`h-2 w-2 rounded-full ${
                    config.published ? "bg-primary" : "bg-ink/25"
                  }`}
                />
                {config.published ? "Boutique en ligne" : "Boutique non publiée"}
              </p>
            </div>
            {config.plan !== "Gratuit" && (
              <div className="text-right">
                <p className="text-xs text-ink/45">Prochaine échéance</p>
                <p className="mt-0.5 flex items-center gap-1.5 font-display font-extrabold">
                  <Clock size={14} className="text-ink/40" /> 28 juillet 2026
                </p>
              </div>
            )}
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-sm">
              <p className="font-semibold">Produits utilisés</p>
              <p className="text-ink/55">
                {used} / {quota === Infinity ? "illimité" : quota}
              </p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-cream">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${quota === Infinity ? 8 : Math.min(100, (used / quota) * 100)}%`,
                  backgroundColor: palette.accent,
                }}
              />
            </div>
          </div>
        </div>
      </Reveal>

      {/* --- Changer d'offre --- */}
      <Reveal delay={0.12}>
        <h2 className="mt-8 font-display text-lg font-extrabold">Changer d&apos;offre</h2>
        <p className="mt-1 text-sm text-ink/55">
          Sans engagement. Tu peux changer ou arrêter quand tu veux.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {PLANS.map((p) => {
            const isCurrent = config.plan === p.name;
            return (
              <div
                key={p.name}
                className={`relative flex flex-col rounded-2xl p-5 transition-all ${
                  isCurrent ? "bg-ink text-white" : "card hover:shadow-lift"
                }`}
              >
                {isCurrent && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-mango px-3 py-0.5 text-[10px] font-bold text-ink">
                    Offre actuelle
                  </span>
                )}
                <p
                  className={`text-xs font-bold uppercase tracking-widest ${
                    isCurrent ? "text-mango" : "text-primary"
                  }`}
                >
                  {p.name}
                </p>
                <p className="mt-2 font-display text-2xl font-extrabold">
                  {fcfa(p.price)}
                  <span
                    className={`text-sm font-semibold ${
                      isCurrent ? "text-white/50" : "text-ink/40"
                    }`}
                  >
                    {" "}
                    / mois
                  </span>
                </p>
                <ul className="mt-4 flex-1 space-y-1.5 text-xs">
                  {p.features.slice(0, 4).map((f) => (
                    <li key={f} className="flex items-start gap-1.5">
                      <Check
                        size={13}
                        className={`mt-0.5 shrink-0 ${isCurrent ? "text-mango" : "text-primary"}`}
                      />
                      <span className={isCurrent ? "text-white/80" : "text-ink/70"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setSelected(p.name as Plan)}
                  disabled={isCurrent}
                  className={`${
                    isCurrent
                      ? "btn bg-white/10 text-white/40"
                      : "btn-primary"
                  } btn-sm mt-5 w-full disabled:cursor-default`}
                >
                  {isCurrent ? "Offre actuelle" : `Choisir ${p.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </Reveal>

      {/* --- Moyen de paiement --- */}
      <Reveal delay={0.18}>
        <h2 className="mt-8 font-display text-lg font-extrabold">Moyen de paiement</h2>
        <div className="card mt-3 flex flex-wrap items-center gap-4 p-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cream text-ink/40">
            <CreditCard size={19} />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold">Aucun moyen de paiement enregistré</p>
            <p className="text-xs text-ink/50">
              Mobile Money : Wave, Orange Money, MTN MoMo, Moov.
            </p>
          </div>
          <button disabled className="btn-ghost btn-sm opacity-50">
            Ajouter
          </button>
        </div>
      </Reveal>

      {/* --- Historique --- */}
      <Reveal delay={0.22}>
        <h2 className="mt-8 font-display text-lg font-extrabold">Historique des paiements</h2>
        <div className="card mt-3 p-10 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-cream text-ink/35">
            <Receipt size={19} />
          </span>
          <p className="mt-3 text-sm font-semibold">Aucun paiement pour l&apos;instant</p>
          <p className="mx-auto mt-1 max-w-xs text-xs text-ink/50">
            Tes factures apparaîtront ici, téléchargeables en PDF.
          </p>
        </div>
      </Reveal>

      {/* --- Note d'intégration --- */}
      <Reveal delay={0.26}>
        <div className="mt-6 flex gap-3 rounded-xl border border-mango/40 bg-mango-soft p-4">
          <Info size={16} className="mt-0.5 shrink-0 text-yellow-700" />
          <div className="text-xs leading-relaxed text-yellow-900">
            <p className="font-bold">Paiement en attente de branchement</p>
            <p className="mt-1">
              L&apos;agrégateur Mobile Money n&apos;est pas encore connecté. Tout l&apos;écran
              est prêt : il ne reste qu&apos;à remplir <code className="font-mono">startCheckout()</code>{" "}
              dans <code className="font-mono">app/dashboard/abonnement/page.tsx</code> et le
              webhook côté serveur.
            </p>
          </div>
        </div>
      </Reveal>

      <AnimatePresence>
        {selected && <CheckoutModal plan={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Tunnel de paiement
 * ------------------------------------------------------------------ */

const OPERATORS = [
  { id: "wave", label: "Wave" },
  { id: "orange", label: "Orange Money" },
  { id: "mtn", label: "MTN MoMo" },
  { id: "moov", label: "Moov Money" },
];

function CheckoutModal({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  const { config, shopId } = useStore();
  const [operator, setOperator] = useState(OPERATORS[0].id);
  const [phone, setPhone] = useState(config.phone ?? "");
  const price = PLANS.find((p) => p.name === plan)?.price ?? 0;

  /* ------------------------------------------------------------------
   * >>> POINT DE BRANCHEMENT DE L'AGRÉGATEUR <<<
   *
   * À implémenter le moment venu :
   *   1. POST vers /api/checkout { plan, operator, phone, shopId }
   *   2. Le serveur crée une intention chez l'agrégateur
   *      (PayDunya / CinetPay / Paystack / Wave Business…)
   *   3. Redirection vers l'URL de paiement, ou push USSD
   *   4. Le webhook confirme -> écrit dans `payments` en service_role
   *      -> met à jour `subscriptions` -> qui met à jour `shops.plan`
   *
   * Rappel sécurité (voir supabase/README.md) :
   *   - vérifier la SIGNATURE du webhook, sinon on forge un paiement
   *   - `idempotency_key` est unique : un webhook rejoué ne double pas
   *   - le vendeur ne peut PAS écrire shops.plan (guard_shop_privileges)
   * ------------------------------------------------------------------ */
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /* Le tunnel appelle /api/checkout, qui fixe le montant côté serveur
     et délègue à l'agrégateur configuré (lib/payment/index.ts).
     Tant qu'aucun agrégateur n'est branché, le fournisseur factice
     répond proprement au lieu de planter. */
  const startCheckout = async () => {
    if (busy) return;
    setBusy(true);
    setErr(null);

    const sb = supabase();
    if (!sb || !shopId) {
      setErr("Le paiement n'est pas encore disponible. Réessaie plus tard.");
      setBusy(false);
      return;
    }

    try {
      const { data } = await sb.auth.getSession();
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({
          shopId,
          plan: plan.toLowerCase(),
          operator,
          phone,
        }),
      });
      const out = await res.json();

      if (out.kind === "redirect") {
        window.location.href = out.url;
        return;
      }
      if (out.kind === "ussd_push") {
        setErr(out.message);
        setBusy(false);
        return;
      }
      setErr(out.message ?? out.error ?? "Le paiement a échoué.");
    } catch {
      setErr("Connexion impossible. Vérifie ton réseau.");
    }
    setBusy(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-white p-6 sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold">Passer à {plan}</h2>
          <button onClick={onClose} className="rounded-full p-2 text-ink/40 hover:bg-cream">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 rounded-xl bg-cream p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold">Offre {plan}</span>
            <span className="font-display text-xl font-extrabold text-primary">
              {fcfa(price)}
              <span className="text-sm font-semibold text-ink/40"> / mois</span>
            </span>
          </div>
          <p className="mt-1 text-xs text-ink/50">Sans engagement, résiliable à tout moment.</p>
        </div>

        <label className="mb-2 mt-5 block text-sm font-bold">Opérateur Mobile Money</label>
        <div className="grid grid-cols-2 gap-2">
          {OPERATORS.map((o) => (
            <button
              key={o.id}
              onClick={() => setOperator(o.id)}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                operator === o.id
                  ? "border-primary bg-primary-soft text-primary-dark"
                  : "border-ink/10 hover:border-ink/40"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <label className="mb-1.5 mt-5 block text-sm font-bold">Numéro à débiter</label>
        <input
          className="input"
          type="tel"
          inputMode="tel"
          value={phone}
          placeholder="07 00 00 00 00"
          onChange={(e) => setPhone(e.target.value)}
        />

        <div className="mt-4 flex gap-2.5 rounded-xl bg-cream p-3">
          <AlertCircle size={15} className="mt-px shrink-0 text-ink/40" />
          <p className="text-[11px] leading-relaxed text-ink/60">
            Le Mobile Money ne permet pas le prélèvement automatique dans tous les pays. Tu
            recevras un rappel WhatsApp 3 jours avant chaque échéance.
          </p>
        </div>

        {err && (
          <p className="mt-4 rounded-xl bg-mango-soft px-3 py-2.5 text-xs leading-relaxed text-yellow-900">
            {err}
          </p>
        )}

        <button
          onClick={startCheckout}
          disabled={busy}
          className="btn-primary btn-lg mt-5 w-full disabled:opacity-40"
        >
          {busy && <Loader2 size={16} className="animate-spin" />}
          {busy ? "Traitement…" : `Payer ${fcfa(price)}`}
        </button>
        <button
          onClick={onClose}
          className="mt-3 w-full text-center text-sm font-semibold text-ink/50 hover:text-ink"
        >
          Annuler
        </button>
      </motion.div>
    </motion.div>
  );
}
