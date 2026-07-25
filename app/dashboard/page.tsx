"use client";

import { NotificationCard } from "@/components/install-prompt";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import OnboardingGuide from "@/components/onboarding";
import { SalesChart, type DayPoint } from "@/components/sales-chart";
import { WelcomeTour } from "@/components/welcome-tour";
import { ORDERS, STATUS_STYLE, demoWave, fcfa, type Order } from "@/lib/data";
import { shopDomain, shopUrl } from "@/lib/config";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import * as api from "@/lib/api";
import { STATUS_LABEL, supabase } from "@/lib/supabase";
import { AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Copy,
  ExternalLink,
  Info,
  Package,
  Palette,
  Share2,
  ReceiptText,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

/* Convertit une commande de la base vers le format d'affichage
   (le même que les commandes de démo), pour que la bascule
   démo -> vraies données soit transparente. */
function dbOrderToDisplay(o: any): Order {
  return {
    id: o.reference ?? o.id?.slice(0, 8) ?? "—",
    client: o.customer_name ?? "Client",
    phone: o.customer_phone ?? "",
    city: o.zone_label ?? "",
    items: (o.order_items ?? []).map((it: any) => ({
      name: it.product_name,
      qty: it.quantity,
      price: it.unit_price,
    })),
    status: (STATUS_LABEL[o.status as keyof typeof STATUS_LABEL] ?? o.status) as Order["status"],
    date: o.created_at
      ? new Date(o.created_at).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "",
  };
}

const PAID_STATUSES = ["payee", "preparation", "expediee", "livree"];

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const sameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

/* Regroupe les commandes d'UN mois par jour, pour le graphique de ventes.
   Un seul passage sur `orders` (les commandes du vendeur, déjà filtrées
   sur ce mois par fetchOrdersInRange) au lieu de re-filtrer tout le
   tableau une fois par jour du mois. */
function dailyBuckets(orders: any[], monthDate: Date): DayPoint[] {
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const days: DayPoint[] = Array.from({ length: daysInMonth }, (_, i) => ({
    key: `${monthDate.getFullYear()}-${monthDate.getMonth()}-${i + 1}`,
    day: i + 1,
    sales: 0,
    count: 0,
  }));
  for (const o of orders) {
    if (!PAID_STATUSES.includes(o.status)) continue;
    const bucket = days[new Date(o.created_at).getDate() - 1];
    if (!bucket) continue;
    bucket.sales += o.total ?? 0;
    bucket.count += 1;
  }
  return days;
}

/* Boutique pas encore publiée : jours d'exemple, avec une activité qui
   décroît plus le mois consulté est ancien (reflète un commerce qui
   grandit) et une variation jour à jour déterministe (pas de hasard :
   le graphique ne doit pas changer d'un rendu à l'autre). Le mois
   courant reste proche des "184 500 F / 31 commandes" déjà affichés
   dans les tuiles au-dessus. */
function demoDaily(monthDate: Date): DayPoint[] {
  const now = new Date();
  const offset = (now.getFullYear() - monthDate.getFullYear()) * 12 + (now.getMonth() - monthDate.getMonth());
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const base = Math.max(700, 6400 - offset * 850);
  const days: DayPoint[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const factor = Math.max(0, 1 + demoWave(day, 1.7, 0.6, offset) * 0.6);
    const sales = Math.round((base * factor) / 500) * 500;
    days.push({
      key: `demo-${offset}-${day}`,
      day,
      sales,
      count: sales > 0 ? Math.max(1, Math.round(sales / 6000)) : 0,
    });
  }
  return days;
}

export default function Overview() {
  const { config, products, palette, shopId } = useStore();
  const { user, demoMode } = useAuth();
  const [copied, setCopied] = useState(false);
  const [realOrders, setRealOrders] = useState<Order[]>([]);
  const [realStats, setRealStats] = useState({ sales: 0, count: 0 });
  const [chartMonth, setChartMonth] = useState(() => startOfMonth(new Date()));
  const [days, setDays] = useState<DayPoint[]>([]);
  const [daysLoading, setDaysLoading] = useState(false);
  const [showTour, setShowTour] = useState(false);

  const published = config.published;

  /* Tutoriel de bienvenue : affiché une seule fois à la première
     connexion (mémorisé en base via profiles.tutorial_seen). */
  useEffect(() => {
    if (demoMode || !user) return;
    const sb = supabase();
    if (!sb) return;
    sb.from("profiles")
      .select("tutorial_seen")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data && data.tutorial_seen === false) setShowTour(true);
      });
  }, [user, demoMode]);

  /* Une fois la boutique publiée : commandes récentes (liste + stats du
     mois en cours, toujours "aujourd'hui" quel que soit le mois consulté
     dans le graphique) depuis les 100 dernières commandes — largement
     suffisant pour "ce mois-ci". */
  useEffect(() => {
    if (!published || !shopId) return;
    let alive = true;
    api.fetchOrders(shopId).then((orders) => {
      if (!alive) return;
      setRealOrders(orders.map(dbOrderToDisplay));
      const now = new Date();
      const inMonth = orders.filter(
        (o: any) => PAID_STATUSES.includes(o.status) && sameMonth(new Date(o.created_at), now)
      );
      setRealStats({
        sales: inMonth.reduce((s: number, o: any) => s + (o.total ?? 0), 0),
        count: inMonth.length,
      });
    });
    return () => {
      alive = false;
    };
  }, [published, shopId]);

  /* Graphique : le mois consulté peut être n'importe lequel de
     l'historique, donc une requête bornée par date plutôt que le
     plafond de 100 commandes récentes (qui ne couvrirait pas un mois
     ancien pour une boutique déjà active). */
  useEffect(() => {
    if (!published || !shopId) {
      setDays(demoDaily(chartMonth));
      return;
    }
    let alive = true;
    setDaysLoading(true);
    const start = chartMonth;
    const end = new Date(chartMonth.getFullYear(), chartMonth.getMonth() + 1, 1);
    api
      .fetchOrdersInRange(shopId, start, end)
      .then((orders) => {
        if (!alive) return;
        setDays(dailyBuckets(orders, chartMonth));
      })
      .finally(() => {
        if (alive) setDaysLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [published, shopId, chartMonth]);

  const slug =
    config.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "ma-boutique";
  const url = shopDomain(slug);

  const copy = () => {
    navigator.clipboard?.writeText(shopUrl(slug));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  /* Non publié : chiffres de démo. Publié : vraies stats. */
  const stats = published
    ? [
        { l: "Ventes du mois", v: fcfa(realStats.sales), delta: "Ce mois-ci", icon: TrendingUp },
        { l: "Commandes", v: String(realStats.count), delta: "Ce mois-ci", icon: ReceiptText },
        {
          l: "Produits en ligne",
          v: String(products.length),
          delta: `Offre ${config.plan}`,
          icon: Package,
        },
      ]
    : [
        { l: "Ventes du mois", v: fcfa(184500), delta: "+22 % vs juin", icon: TrendingUp },
        { l: "Commandes", v: "31", delta: "+8 cette semaine", icon: ReceiptText },
        {
          l: "Produits en ligne",
          v: String(products.length),
          delta: `Offre ${config.plan}`,
          icon: Package,
        },
      ];

  /* Non publié : commandes de démo. Publié : vraies commandes de la base. */
  const recentOrders = published ? realOrders.slice(0, 4) : ORDERS.slice(0, 4);

  return (
    <div>
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Bonjour</h1>
            <p className="mt-1 text-sm text-ink/55">
              Voici ce qui se passe sur <span className="font-bold text-ink">{config.name}</span>{" "}
              aujourd&apos;hui.
            </p>
          </div>
          <Link href="/boutique" className="btn-primary btn-md">
            Voir ma boutique <ExternalLink size={14} />
          </Link>
        </div>
      </Reveal>

      <div className="mt-6 space-y-4">
        <OnboardingGuide />
        <NotificationCard />
      </div>

      {/* Bandeau : données d'exemple tant que la boutique n'est pas publiée. */}
      {!published && (
        <Reveal delay={0.04}>
          <div className="mt-4 flex gap-3 rounded-xl border border-mango/40 bg-mango-soft p-4">
            <Info size={16} className="mt-0.5 shrink-0 text-yellow-700" />
            <div className="text-xs leading-relaxed text-yellow-900">
              <p className="font-bold">Données de démonstration</p>
              <p className="mt-1">
                Ces chiffres et commandes sont des exemples. Une fois ta boutique publiée, ils
                seront mis à jour avec tes vraies ventes.
              </p>
            </div>
          </div>
        </Reveal>
      )}

      <Stagger className="mt-4 grid gap-4 sm:grid-cols-3" gap={0.08}>
        {stats.map((s) => (
          <StaggerItem key={s.l}>
            <div className={`card p-5 ${!published ? "opacity-75" : ""}`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-ink/55">{s.l}</p>
                <s.icon size={16} style={{ color: palette.accent }} />
              </div>
              <p className="mt-2 font-display text-2xl font-extrabold">{s.v}</p>
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-primary-dark">
                <ArrowUpRight size={13} /> {s.delta}
              </p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal delay={0.1}>
        <SalesChart
          days={days}
          monthDate={chartMonth}
          loading={daysLoading}
          accent={palette.accent}
          onPrevMonth={() => setChartMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          onNextMonth={() => setChartMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          canGoNext={chartMonth.getTime() < startOfMonth(new Date()).getTime()}
        />
      </Reveal>

      <Reveal delay={0.12}>
        <div className="card mt-6 grid gap-3 p-5 sm:grid-cols-2">
          <Link
            href="/dashboard/produits"
            className="flex items-center gap-3 rounded-xl bg-cream p-4 transition-colors hover:bg-ink/5"
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: palette.accent + "1A", color: palette.accent }}
            >
              <Package size={18} />
            </span>
            <span>
              <span className="block text-sm font-bold">Ajouter un produit</span>
              <span className="block text-xs text-ink/50">Photo, prix, stock — en 1 minute</span>
            </span>
          </Link>
          <Link
            href="/dashboard/boutique"
            className="flex items-center gap-3 rounded-xl bg-cream p-4 transition-colors hover:bg-ink/5"
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: palette.accent + "1A", color: palette.accent }}
            >
              <Palette size={18} />
            </span>
            <span>
              <span className="block text-sm font-bold">Personnaliser ma boutique</span>
              <span className="block text-xs text-ink/50">Couleur, modèle, textes, livraison</span>
            </span>
          </Link>
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="card mt-6 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-display text-lg font-extrabold">Dernières commandes</h2>
            <Link
              href="/dashboard/commandes"
              className="flex items-center gap-1 text-sm font-bold hover:underline"
              style={{ color: palette.accent }}
            >
              Tout voir <ArrowRight size={14} />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-cream text-ink/35">
                <ReceiptText size={19} />
              </span>
              <p className="mt-3 text-sm font-semibold">Aucune commande pour l&apos;instant</p>
              <p className="mx-auto mt-1 max-w-xs text-xs text-ink/50">
                Tes commandes apparaîtront ici dès qu&apos;un client passe commande.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-ink/5">
              {recentOrders.map((o) => (
                <Link
                  key={o.id}
                  href="/dashboard/commandes"
                  className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-cream"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold">
                      {o.id} · <span className="font-semibold text-ink/70">{o.client}</span>
                    </p>
                    <p className="truncate text-xs text-ink/50">
                      {o.items.map((i) => `${i.name} ×${i.qty}`).join(" · ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden text-sm font-extrabold sm:block">
                      {fcfa(o.items.reduce((s, i) => s + i.qty * i.price, 0))}
                    </span>
                    <span className={`chip ${STATUS_STYLE[o.status]}`}>{o.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Reveal>

      <Reveal delay={0.22}>
        <div
          className="wax-pattern-dense mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl px-6 py-5 text-white"
          style={{ background: `linear-gradient(135deg, ${palette.accent}, ${palette.accent}CC)` }}
        >
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-display font-extrabold">
              <Share2 size={16} /> Partage ta boutique
            </p>
            <p className="mt-0.5 truncate text-sm text-white/80">
              {url} — colle ce lien sur tes réseaux.
            </p>
            {!published && (
              <p className="mt-2 text-xs text-white/90">
                Pour rendre ta boutique accessible à tes clients, tu dois d&apos;abord
                t&apos;abonner et la publier.
              </p>
            )}
          </div>
          {published ? (
            <button
              className="btn shrink-0 bg-white px-5 py-2.5 text-sm hover:bg-cream"
              style={{ color: palette.accent }}
              onClick={copy}
            >
              {copied ? (
                <span key="ok" className="animate-pop flex items-center gap-1.5">
                  <Check size={15} /> Lien copié
                </span>
              ) : (
                <span key="copy" className="flex items-center gap-1.5">
                  <Copy size={15} /> Copier le lien
                </span>
              )}
            </button>
          ) : (
            <Link
              href="/dashboard/abonnement"
              className="btn shrink-0 bg-white px-5 py-2.5 text-sm hover:bg-cream"
              style={{ color: palette.accent }}
            >
              S&apos;abonner
            </Link>
          )}
        </div>
      </Reveal>

      <AnimatePresence>
        {showTour && <WelcomeTour onClose={() => setShowTour(false)} />}
      </AnimatePresence>
    </div>
  );
}