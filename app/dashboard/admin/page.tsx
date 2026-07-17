"use client";

import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { ErrorScreen, LoadingScreen, SkeletonList } from "@/components/states";
import { fcfa } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ImageOff,
  PackageX,
  Search,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

/* ------------------------------------------------------------------ *
 * Administration
 *
 * Ce que je cherche à montrer, ce ne sont pas des compteurs mais les
 * quatre questions qui décident du business :
 *   1. Est-ce que ça rapporte ?        -> MRR, ARPU
 *   2. Où perd-on les vendeurs ?       -> entonnoir d'activation
 *   3. Qui va partir ?                 -> santé (impayés, sans vente)
 *   4. Qui porte la plateforme ?       -> palmarès
 *
 * La protection est en base : les vues sont filtrées par
 * auth_is_admin() et ne renvoient AUCUNE ligne à un non-admin.
 * Forcer l'URL ne montre rien.
 * ------------------------------------------------------------------ */

type Mrr = { mrr: number; abonnes_payants: number; arpu: number };
type Funnel = {
  inscrits: number;
  ont_un_produit: number;
  ont_trois_produits: number;
  ont_une_photo: number;
  ont_publie: number;
  ont_vendu: number;
  ont_paye: number;
};
type Health = {
  actives_sans_vente_30j: number;
  en_impaye: number;
  publiees_sans_photo: number;
  publiees_sans_produit: number;
};
type TopShop = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  commandes: number;
  volume: number;
  derniere_commande: string | null;
};
type Growth = { mois: string; creees: number; publiees: number; payantes: number };
type Stats = {
  shops_total: number;
  shops_actives: number;
  commandes_total: number;
  commandes_30j: number;
  volume_total: number;
  produits_total: number;
  signalements_ouverts: number;
};

/* Démo : chiffres plausibles pour une plateforme de 6 mois. */
const D = {
  mrr: { mrr: 148_800, abonnes_payants: 87, arpu: 1710 } as Mrr,
  funnel: {
    inscrits: 214,
    ont_un_produit: 156,
    ont_trois_produits: 118,
    ont_une_photo: 94,
    ont_publie: 102,
    ont_vendu: 71,
    ont_paye: 87,
  } as Funnel,
  health: {
    actives_sans_vente_30j: 14,
    en_impaye: 6,
    publiees_sans_photo: 8,
    publiees_sans_produit: 3,
  } as Health,
  stats: {
    shops_total: 214,
    shops_actives: 102,
    commandes_total: 3671,
    commandes_30j: 512,
    volume_total: 24_850_000,
    produits_total: 1842,
    signalements_ouverts: 2,
  } as Stats,
  growth: [
    { mois: "2026-02", creees: 12, publiees: 5, payantes: 4 },
    { mois: "2026-03", creees: 28, publiees: 14, payantes: 11 },
    { mois: "2026-04", creees: 41, publiees: 21, payantes: 17 },
    { mois: "2026-05", creees: 47, publiees: 24, payantes: 21 },
    { mois: "2026-06", creees: 52, publiees: 22, payantes: 19 },
    { mois: "2026-07", creees: 34, publiees: 16, payantes: 15 },
  ] as Growth[],
  top: [
    { id: "1", name: "Tech Abidjan", slug: "tech-abidjan", plan: "premium", commandes: 402, volume: 8_900_000, derniere_commande: new Date().toISOString() },
    { id: "2", name: "Kadi Store", slug: "kadi-store", plan: "business", commandes: 187, volume: 2_340_000, derniere_commande: new Date().toISOString() },
    { id: "3", name: "Chez Tantie", slug: "chez-tantie", plan: "business", commandes: 164, volume: 890_000, derniere_commande: new Date().toISOString() },
    { id: "4", name: "Baobab Soins", slug: "baobab-soins", plan: "starter", commandes: 93, volume: 740_000, derniere_commande: null },
    { id: "5", name: "SAPE & CO", slug: "sape-co", plan: "premium", commandes: 78, volume: 2_100_000, derniere_commande: new Date().toISOString() },
  ] as TopShop[],
};

const PLAN_STYLE: Record<string, string> = {
  gratuit: "bg-ink/5 text-ink/50",
  starter: "bg-primary-soft text-primary-dark",
  business: "bg-mango-soft text-yellow-800",
  premium: "bg-ink text-white",
};

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [mrr, setMrr] = useState<Mrr | null>(null);
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [growth, setGrowth] = useState<Growth[]>([]);
  const [top, setTop] = useState<TopShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");
  const demoMode = !supabase();

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);

    if (demoMode) {
      setIsAdmin(true);
      setMrr(D.mrr);
      setFunnel(D.funnel);
      setHealth(D.health);
      setStats(D.stats);
      setGrowth(D.growth);
      setTop(D.top);
      setLoading(false);
      return;
    }

    const sb = supabase()!;
    try {
      const uid = (await sb.auth.getUser()).data.user?.id ?? "";
      const { data: profile } = await sb
        .from("profiles")
        .select("is_admin")
        .eq("id", uid)
        .maybeSingle();

      if (!profile?.is_admin) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setIsAdmin(true);

      const [m, f, h, s, g, t] = await Promise.all([
        sb.from("admin_mrr").select("*").maybeSingle(),
        sb.from("admin_funnel").select("*").maybeSingle(),
        sb.from("admin_health").select("*").maybeSingle(),
        sb.from("admin_stats").select("*").maybeSingle(),
        sb.from("admin_growth").select("*"),
        sb.from("admin_top_shops").select("*"),
      ]);
      setMrr(m.data as Mrr);
      setFunnel(f.data as Funnel);
      setHealth(h.data as Health);
      setStats(s.data as Stats);
      setGrowth((g.data ?? []) as Growth[]);
      setTop((t.data ?? []) as TopShop[]);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [demoMode]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id: string, status: string) => {
    const reason = status === "suspendue" ? prompt("Motif de la suspension :") : null;
    if (status === "suspendue" && !reason) return;
    if (demoMode) return;
    await supabase()!.rpc("admin_set_shop_status", { target: id, new_status: status, reason });
    load();
  };

  const filtered = useMemo(
    () =>
      top.filter(
        (s) => !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.slug.includes(q.toLowerCase())
      ),
    [top, q]
  );

  if (loading) return <LoadingScreen label="Chargement des statistiques…" />;
  if (error) return <ErrorScreen onRetry={load} />;

  if (isAdmin === false)
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-terra-soft text-terra">
          <Ban size={24} />
        </span>
        <h1 className="mt-5 font-display text-xl font-extrabold">Accès réservé</h1>
        <p className="mt-2 max-w-xs text-sm text-ink/55">
          Cet espace est réservé aux administrateurs de la plateforme.
        </p>
      </div>
    );

  /* Taux qui comptent vraiment */
  const conv = funnel && funnel.inscrits ? (funnel.ont_paye / funnel.inscrits) * 100 : 0;
  const activation = funnel && funnel.inscrits ? (funnel.ont_publie / funnel.inscrits) * 100 : 0;
  const alertes =
    (health?.en_impaye ?? 0) +
    (health?.publiees_sans_produit ?? 0) +
    (stats?.signalements_ouverts ?? 0);

  return (
    <div>
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Mon business</h1>
            <p className="mt-1 text-sm text-ink/55">
              Ce qui décide de la suite : revenu, activation, rétention.
            </p>
          </div>
          {alertes > 0 && (
            <span className="chip bg-terra-soft text-terra">
              <AlertTriangle size={12} /> {alertes} point{alertes > 1 ? "s" : ""} d&apos;attention
            </span>
          )}
        </div>
      </Reveal>

      {/* ---------- L'argent ---------- */}
      <Stagger className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" gap={0.05}>
        <StaggerItem>
          <div className="card bg-ink p-5 text-white">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-white/50">
                Revenu mensuel
              </p>
              <Wallet size={15} className="text-mango" />
            </div>
            <p className="mt-2 font-display text-2xl font-extrabold">{fcfa(mrr?.mrr ?? 0)}</p>
            <p className="mt-0.5 text-xs text-white/45">
              {mrr?.abonnes_payants ?? 0} abonnés · {fcfa(mrr?.arpu ?? 0)} en moyenne
            </p>
          </div>
        </StaggerItem>
        <Metric
          label="Conversion"
          value={`${conv.toFixed(1)} %`}
          sub={`${funnel?.ont_paye ?? 0} payants sur ${funnel?.inscrits ?? 0} inscrits`}
          icon={TrendingUp}
        />
        <Metric
          label="Activation"
          value={`${activation.toFixed(0)} %`}
          sub={`${funnel?.ont_publie ?? 0} boutiques publiées`}
          icon={Users}
        />
        <Metric
          label="Volume traité"
          value={fcfa(stats?.volume_total ?? 0)}
          sub={`${stats?.commandes_30j ?? 0} commandes sur 30 j`}
          icon={TrendingUp}
        />
      </Stagger>

      {/* ---------- Entonnoir : où on perd les vendeurs ---------- */}
      <Reveal delay={0.1}>
        <div className="card mt-6 p-5">
          <p className="font-display font-extrabold">Où perd-on les vendeurs ?</p>
          <p className="mt-0.5 text-xs text-ink/50">
            Chaque marche perdue est un vendeur qui ne paiera jamais.
          </p>

          <div className="mt-4 space-y-2.5">
            {funnel &&
              [
                { l: "Inscrits", n: funnel.inscrits },
                { l: "Ont ajouté un produit", n: funnel.ont_un_produit },
                { l: "Ont 3 produits ou plus", n: funnel.ont_trois_produits },
                { l: "Ont mis une photo", n: funnel.ont_une_photo },
                { l: "Ont publié", n: funnel.ont_publie },
                { l: "Ont reçu une commande", n: funnel.ont_vendu },
                { l: "Paient un abonnement", n: funnel.ont_paye },
              ].map((step, i, arr) => {
                const pct = funnel.inscrits ? (step.n / funnel.inscrits) * 100 : 0;
                const prev = i > 0 ? arr[i - 1].n : step.n;
                const drop = prev - step.n;
                const dropPct = prev ? (drop / prev) * 100 : 0;
                /* On signale les marches qui saignent : au-delà de 25 %
                   de perte, c'est là qu'il faut travailler. */
                const bleeds = i > 0 && dropPct > 25;

                return (
                  <div key={step.l}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold">{step.l}</span>
                      <span className="flex items-center gap-2">
                        {bleeds && (
                          <span className="font-bold text-terra">−{Math.round(dropPct)} %</span>
                        )}
                        <span className="font-bold">{step.n}</span>
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-cream">
                      <div
                        className="h-full rounded-full transition-[width] duration-700"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: bleeds ? "#E2674A" : "#0E8A52",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </Reveal>

      {/* ---------- Santé : qui va partir ---------- */}
      <Reveal delay={0.14}>
        <p className="mt-8 font-display text-lg font-extrabold">À traiter maintenant</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Alert
            n={health?.en_impaye ?? 0}
            label="En impayé"
            hint="Dépubliées dans 7 jours"
            icon={Wallet}
            grave
          />
          <Alert
            n={health?.actives_sans_vente_30j ?? 0}
            label="Sans vente (30 j)"
            hint="Les prochains à partir"
            icon={TrendingUp}
          />
          <Alert
            n={health?.publiees_sans_photo ?? 0}
            label="Publiées sans photo"
            hint="Ne vendront pas"
            icon={ImageOff}
          />
          <Alert
            n={health?.publiees_sans_produit ?? 0}
            label="Publiées et vides"
            hint="Lien partagé vers une page vide"
            icon={PackageX}
            grave
          />
        </div>
      </Reveal>

      {/* ---------- Croissance ---------- */}
      {growth.length > 0 && (
        <Reveal delay={0.18}>
          <div className="card mt-8 p-5">
            <p className="font-display font-extrabold">Croissance</p>
            <p className="mt-0.5 text-xs text-ink/50">Créations et abonnements par mois</p>
            <div className="nice-scroll mt-4 flex items-end gap-2 overflow-x-auto pb-1">
              {growth.map((g) => {
                const max = Math.max(...growth.map((x) => x.creees), 1);
                return (
                  <div key={g.mois} className="flex w-full min-w-[42px] flex-col items-center gap-1">
                    <div className="flex h-24 w-full flex-col justify-end gap-0.5">
                      <div
                        className="w-full rounded-t bg-primary transition-all"
                        style={{ height: `${(g.payantes / max) * 100}%` }}
                        title={`${g.payantes} payantes`}
                      />
                      <div
                        className="w-full rounded-b bg-ink/10 transition-all"
                        style={{ height: `${((g.creees - g.payantes) / max) * 100}%` }}
                        title={`${g.creees - g.payantes} gratuites`}
                      />
                    </div>
                    <span className="text-[9px] font-semibold text-ink/40">
                      {g.mois.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" /> Payantes
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-ink/15" /> Gratuites
              </span>
            </div>
          </div>
        </Reveal>
      )}

      {/* ---------- Palmarès ---------- */}
      <Reveal delay={0.22}>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-lg font-extrabold">Qui porte la plateforme</p>
            <p className="text-xs text-ink/50">Classées par volume traité</p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
            <input
              className="input py-2 pl-9 text-sm"
              placeholder="Chercher une boutique…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </Reveal>

      <div className="mt-3 space-y-2.5">
        {filtered.map((s, i) => {
          const dormante =
            !s.derniere_commande ||
            Date.now() - new Date(s.derniere_commande).getTime() > 30 * 864e5;
          return (
            <div key={s.id} className="card flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap">
              <span className="w-5 shrink-0 text-center font-display text-sm font-extrabold text-ink/25">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
                  {s.name}
                  <span className={`chip ${PLAN_STYLE[s.plan]}`}>{s.plan}</span>
                  {dormante && (
                    <span className="chip bg-terra-soft text-terra">Aucune vente 30 j</span>
                  )}
                </p>
                <p className="truncate text-xs text-ink/45">{s.slug}.boutik-app.com</p>
              </div>
              <div className="flex shrink-0 gap-5 text-right text-xs">
                <div>
                  <p className="font-bold">{s.commandes}</p>
                  <p className="text-ink/40">commandes</p>
                </div>
                <div>
                  <p className="font-bold text-primary">{fcfa(s.volume)}</p>
                  <p className="text-ink/40">volume</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  onClick={() => setStatus(s.id, "suspendue")}
                  className="rounded-full border border-ink/10 p-2 text-ink/40 transition-colors hover:border-terra hover:text-terra"
                  title="Suspendre"
                >
                  <Ban size={14} />
                </button>
                <button
                  onClick={() => setStatus(s.id, "active")}
                  className="rounded-full border border-ink/10 p-2 text-ink/40 transition-colors hover:border-primary hover:text-primary"
                  title="Réactiver"
                >
                  <CheckCircle2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="card p-10 text-center">
            <p className="font-display font-bold">Aucune boutique trouvée</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
}) {
  return (
    <StaggerItem>
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/45">{label}</p>
          <Icon size={15} className="text-primary" />
        </div>
        <p className="mt-2 font-display text-2xl font-extrabold">{value}</p>
        <p className="mt-0.5 text-xs text-ink/50">{sub}</p>
      </div>
    </StaggerItem>
  );
}

function Alert({
  n,
  label,
  hint,
  icon: Icon,
  grave,
}: {
  n: number;
  label: string;
  hint: string;
  icon: LucideIcon;
  grave?: boolean;
}) {
  const on = n > 0;
  return (
    <div className={`card p-4 ${on && grave ? "ring-1 ring-terra/30" : ""}`}>
      <div className="flex items-center gap-2.5">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            on ? (grave ? "bg-terra-soft text-terra" : "bg-mango-soft text-yellow-700") : "bg-cream text-ink/25"
          }`}
        >
          <Icon size={15} />
        </span>
        <p className={`font-display text-xl font-extrabold ${on && grave ? "text-terra" : ""}`}>
          {n}
        </p>
      </div>
      <p className="mt-2 text-xs font-bold">{label}</p>
      <p className="text-[11px] leading-snug text-ink/45">{hint}</p>
    </div>
  );
}
