"use client";

import { FlagIcon } from "@/components/flag-icon";
import { Reveal } from "@/components/motion";
import { PLANS, fcfa } from "@/lib/data";
import { PLAN_QUOTA, useStore, type Plan } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import * as api from "@/lib/api";
import { COUNTRIES, getCountry, normalizePhone, validatePhone } from "@/lib/countries";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, Clock, CreditCard, Loader2, Receipt, X } from "lucide-react";
import { useEffect, useState } from "react";

const PLAN_RANK: Record<Plan, number> = { Gratuit: 0, Starter: 1, Business: 2, Premium: 3 };

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/* Vérifie un paiement. Renvoie le statut détaillé + le plan si payé. */
async function verifyPayment(
  reference: string
): Promise<{ status: string; plan?: string }> {
  const sb = supabase();
  if (!sb) return { status: "pending" };
  try {
    const { data } = await sb.auth.getSession();
    const res = await fetch("/api/paiement/verifier", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.session?.access_token ?? ""}`,
      },
      body: JSON.stringify({ reference }),
    });
    return await res.json();
  } catch {
    return { status: "pending" };
  }
}

type PaymentHistoryRow = Awaited<ReturnType<typeof api.fetchPaymentHistory>>[number];

export default function SubscriptionPage() {
  const { config, products, shopId, setConfig } = useStore();
  const [selected, setSelected] = useState<Plan | null>(null);
  const [expiry, setExpiry] = useState<string | null>(null);
  const [recovering, setRecovering] = useState(false);
  const [history, setHistory] = useState<PaymentHistoryRow[]>([]);

  const quota = PLAN_QUOTA[config.plan];
  const used = products.length;

  useEffect(() => {
    if (!shopId || config.plan === "Gratuit") {
      setExpiry(null);
      return;
    }
    let alive = true;
    api.fetchActiveSubscription(shopId).then((sub) => {
      if (alive && sub?.current_period_end) setExpiry(sub.current_period_end);
    });
    return () => {
      alive = false;
    };
  }, [shopId, config.plan]);

  /* Historique de facturation : rechargé après le filet de retour
     (recovering) et à chaque fermeture du tunnel de paiement (selected
     revient à null, y compris juste après un paiement réussi), pas
     seulement au montage — pour que le tableau se mette à jour sans
     recharger la page. */
  useEffect(() => {
    if (!shopId) return;
    let alive = true;
    api.fetchPaymentHistory(shopId).then((rows) => {
      if (alive) setHistory(rows);
    });
    return () => {
      alive = false;
    };
  }, [shopId, recovering, selected]);

  /* Filet de retour : au chargement, revérifie les paiements en attente.
     Parcourt plusieurs paiements car le plus récent peut être un essai
     rejeté alors qu'un plus ancien est bien payé. */
  useEffect(() => {
    if (!shopId) return;
    let alive = true;

    (async () => {
      const sb = supabase();
      if (!sb) return;

      const { data: pendings } = await sb
        .from("payments")
        .select("idempotency_key")
        .eq("shop_id", shopId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);

      if (!alive || !pendings || pendings.length === 0) return;

      setRecovering(true);
      for (const p of pendings) {
        if (!alive || !p.idempotency_key) break;
        const out = await verifyPayment(p.idempotency_key);
        if (out.status === "success" && out.plan) {
          const label = out.plan.charAt(0).toUpperCase() + out.plan.slice(1);
          setConfig({ plan: label as Plan });
          break;
        }
      }
      if (alive) setRecovering(false);
    })();

    return () => {
      alive = false;
    };
  }, [shopId, setConfig]);

  const daysLeft = expiry
    ? Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div>
      <Reveal>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Mon abonnement</h1>
        <p className="mt-1 text-sm text-ink/55">
          Ton offre, ta facturation et tes paiements.
        </p>
      </Reveal>

      {recovering && (
        <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-primary-soft px-4 py-3">
          <Loader2 size={16} className="animate-spin text-primary" />
          <p className="text-sm font-medium text-primary-dark">
            Vérification de ton dernier paiement…
          </p>
        </div>
      )}

      <Reveal delay={0.06}>
        <div className="card mt-5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink/55">
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
                <p className="text-xs text-ink/55">Prochaine échéance</p>
                <p className="mt-0.5 flex items-center gap-1.5 font-display font-extrabold">
                  <Clock size={14} className="text-ink/40" />
                  {expiry ? formatDate(expiry) : "—"}
                </p>
              </div>
            )}
          </div>

          {config.plan !== "Gratuit" && daysLeft !== null && daysLeft <= 7 && (
            <div className="mt-4 flex gap-2.5 rounded-xl bg-mango-soft px-3 py-2.5">
              <AlertCircle size={15} className="mt-px shrink-0 text-yellow-700" />
              <p className="text-xs leading-relaxed text-yellow-900">
                {daysLeft > 0
                  ? `Ton abonnement expire dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}. Pense à le renouveler pour garder ta boutique en ligne.`
                  : "Ton abonnement a expiré. Renouvelle-le pour remettre ta boutique en ligne."}
              </p>
            </div>
          )}

          <div className="mt-5">
            <div className="flex items-center justify-between text-sm">
              <p className="font-semibold">Produits utilisés</p>
              <p className="text-ink/55">
                {used} / {quota === Infinity ? "illimité" : quota}
              </p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-cream">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{
                  width: `${quota === Infinity ? 8 : Math.min(100, (used / quota) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.12}>
        <h2 className="mt-8 font-display text-lg font-extrabold">Changer d&apos;offre</h2>
        <p className="mt-1 text-sm text-ink/55">
          Sans engagement. Tu peux changer ou arrêter quand tu veux.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {PLANS.map((p) => {
            const isCurrent = config.plan === p.name;
            const isLower = PLAN_RANK[p.name as Plan] < PLAN_RANK[config.plan];
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
                      isCurrent ? "text-white/50" : "text-ink/50"
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
                  disabled={isCurrent || isLower}
                  title={isLower ? "Ton offre actuelle est déjà supérieure." : undefined}
                  className={`${
                    isCurrent
                      ? "btn bg-white/10 text-white/40"
                      : isLower
                        ? "btn bg-ink/5 text-ink/35"
                        : "btn-primary"
                  } btn-sm mt-5 w-full disabled:cursor-default`}
                >
                  {isCurrent ? "Offre actuelle" : isLower ? "Offre déjà dépassée" : `Choisir ${p.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </Reveal>

      <Reveal delay={0.18}>
        <h2 className="mt-8 font-display text-lg font-extrabold">Moyen de paiement</h2>
        <div className="card mt-3 flex flex-wrap items-center gap-4 p-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cream text-ink/40">
            <CreditCard size={19} />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold">Mobile Money</p>
            <p className="text-xs text-ink/50">
              Paiement au moment de l&apos;abonnement, selon ton pays et ton opérateur.
            </p>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.22}>
        <h2 className="mt-8 font-display text-lg font-extrabold">Historique des paiements</h2>
        {history.length === 0 ? (
          <div className="card mt-3 p-10 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-cream text-ink/35">
              <Receipt size={19} />
            </span>
            <p className="mt-3 text-sm font-semibold">Aucun paiement pour l&apos;instant</p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-ink/50">
              Tes paiements confirmés apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="card mt-3 divide-y divide-ink/5 overflow-hidden">
            {history.map((h) => (
              <div key={h.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 p-4">
                <div>
                  <p className="text-sm font-bold">Offre {h.plan}</p>
                  <p className="text-xs text-ink/50">
                    Payé le {formatDate(h.paidAt)} · échéance le {formatDate(h.dueAt)}
                  </p>
                </div>
                <p className="font-display text-sm font-extrabold text-primary">{fcfa(h.amount)}</p>
              </div>
            ))}
          </div>
        )}
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

type PayPhase = "form" | "waiting" | "success";

function CheckoutModal({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  const { config, shopId, setConfig } = useStore();

  const [countryIso, setCountryIso] = useState("BJ");
  const country = getCountry(countryIso) ?? COUNTRIES[0];

  const [operator, setOperator] = useState(country.operators[0].code);
  const [phone, setPhone] = useState(config.phone ?? "");
  const price = PLANS.find((p) => p.name === plan)?.price ?? 0;

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [phase, setPhase] = useState<PayPhase>("form");

  const changeCountry = (iso: string) => {
    setCountryIso(iso);
    const c = getCountry(iso);
    if (c) setOperator(c.operators[0].code);
    setErr(null);
  };

  /* Vérification active en direct.
     SebPay confirme parfois très tard (jusqu'à ~10 min). On borne sur
     le TEMPS écoulé, pas sur un compteur : si le navigateur suspend les
     timers (écran verrouillé, appli en arrière-plan), on ne compte pas
     les tics perdus. Chaque paiement a SA boucle : deux vendeurs
     simultanés sont indépendants. Un rejet arrête tout immédiatement. */
  const pollVerification = async (reference: string) => {
    const DEADLINE = Date.now() + 10 * 60 * 1000; // 10 minutes

    while (Date.now() < DEADLINE) {
      await new Promise((r) => setTimeout(r, 4000));

      const out = await verifyPayment(reference);

      if (out.status === "success") {
        setPhase("success");
        if (out.plan) {
          const label = out.plan.charAt(0).toUpperCase() + out.plan.slice(1);
          setConfig({ plan: label as Plan });
        }
        return;
      }

      /* Refusé ou annulé : on arrête net, sans attendre les 10 min. */
      if (out.status === "rejected") {
        setErr("Le paiement a été refusé ou annulé. Vérifie ton solde et réessaie.");
        setPhase("form");
        setBusy(false);
        return;
      }
      /* pending : on continue la boucle. */
    }

    setErr(
      "Ton paiement est encore en cours de validation. Si tu as bien confirmé, ta boutique sera activée dès réception — reviens sur cette page dans quelques minutes."
    );
    setPhase("form");
    setBusy(false);
  };

  const startCheckout = async () => {
    if (busy) return;

    const phoneError = validatePhone(phone, country);
    if (phoneError) {
      setErr(phoneError);
      return;
    }

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
          phone: normalizePhone(phone, country),
          country: country.iso,
        }),
      });
      const out = await res.json();

      if (out.kind === "redirect") {
        window.location.href = out.url;
        return;
      }
      if (out.kind === "ussd_push") {
        setPhase("waiting");
        void pollVerification(out.reference);
        return;
      }
      setErr(out.message ?? out.error ?? "Le paiement a échoué.");
      setBusy(false);
    } catch {
      setErr("Connexion impossible. Vérifie ton réseau.");
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={phase === "waiting" ? undefined : onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl"
      >
        {phase === "success" ? (
          <div className="py-6 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Check size={28} />
            </span>
            <h2 className="mt-4 font-display text-xl font-extrabold">Paiement confirmé</h2>
            <p className="mx-auto mt-2 max-w-xs text-sm text-ink/60">
              Ton offre {plan} est maintenant active. Merci !
            </p>
            <button onClick={onClose} className="btn-primary btn-lg mt-6 w-full">
              Terminé
            </button>
          </div>
        ) : phase === "waiting" ? (
          <div className="py-8 text-center">
            <div className="relative mx-auto h-16 w-16">
              <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
              <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Loader2 size={28} className="animate-spin" />
              </span>
            </div>
            <h2 className="mt-5 font-display text-xl font-extrabold">
              Paiement en cours de validation
            </h2>
            <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-ink/60">
              <strong>Ne quitte pas cette page.</strong> Si ton paiement est effectif, ta
              boutique est en cours de configuration. Cela peut prendre jusqu&apos;à 5 minutes.
            </p>
            <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-ink/40">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              <span>Vérification automatique en cours</span>
            </div>
          </div>
        ) : (
          <>
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
                  <span className="text-sm font-semibold text-ink/50"> / mois</span>
                </span>
              </div>
              <p className="mt-1 text-xs text-ink/50">Sans engagement, résiliable à tout moment.</p>
            </div>

            <label className="mb-1.5 mt-5 block text-sm font-bold">Pays</label>
            {/* Wrapper porteur de l'apparence : une classe utilitaire posée
                directement sur .input se ferait battre par son propre
                padding (même spécificité), et le drapeau chevaucherait le
                début du nom du pays. */}
            <div className="flex items-center gap-1.5 rounded-xl border border-ink/15 bg-white pl-2.5 pr-1">
              <FlagIcon iso={countryIso} className="h-3.5 w-5 shrink-0" />
              <select
                className="w-full border-0 bg-transparent py-3 pr-1 text-sm outline-none"
                value={countryIso}
                onChange={(e) => changeCountry(e.target.value)}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.iso} value={c.iso}>
                    {c.name} (+{c.dialCode})
                  </option>
                ))}
              </select>
            </div>

            <label className="mb-2 mt-5 block text-sm font-bold">Opérateur Mobile Money</label>
            <div className="grid grid-cols-2 gap-2">
              {country.operators.map((o) => (
                <button
                  key={o.code}
                  onClick={() => setOperator(o.code)}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                    operator === o.code
                      ? "border-primary bg-primary-soft text-primary-dark"
                      : "border-ink/10 hover:border-ink/40"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            <label className="mb-1.5 mt-5 block text-sm font-bold">
              Numéro à débiter ({country.nsnLength} chiffres)
            </label>
            <div className="flex items-stretch gap-2">
              <span className="flex items-center rounded-xl bg-cream px-3 text-sm font-semibold text-ink/60">
                +{country.dialCode}
              </span>
              <input
                className="input flex-1"
                type="tel"
                inputMode="tel"
                value={phone}
                placeholder="01 97 11 29 09"
                onChange={(e) => {
                  setPhone(e.target.value);
                  setErr(null);
                }}
              />
            </div>

            <div className="mt-4 flex gap-2.5 rounded-xl bg-cream p-3">
              <AlertCircle size={15} className="mt-px shrink-0 text-ink/40" />
              <p className="text-[11px] leading-relaxed text-ink/60">
                Un message Mobile Money sera envoyé sur ce numéro pour valider le paiement. Vérifie
                que le numéro correspond bien à l&apos;opérateur choisi.
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
          </>
        )}
      </motion.div>
    </motion.div>
  );
}