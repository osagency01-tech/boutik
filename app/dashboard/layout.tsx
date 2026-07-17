"use client";

import { BoutikLogo } from "@/components/brand";
import { ShopLogo } from "@/components/icons";
import { LoadingScreen, OfflineBanner } from "@/components/states";
import { AuthProvider, useAuth } from "@/lib/auth";
import { StoreProvider, useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import {
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MessageSquare,
  Package,
  Palette,
  ReceiptText,
  Shield,
  Store,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { l: "Aperçu", h: "/dashboard", icon: LayoutDashboard },
  { l: "Commandes", h: "/dashboard/commandes", icon: ReceiptText },
  { l: "Messages", h: "/dashboard/messages", icon: MessageSquare },
  { l: "Produits", h: "/dashboard/produits", icon: Package },
  { l: "Ma boutique", h: "/dashboard/boutique", icon: Palette },
  { l: "Abonnement", h: "/dashboard/abonnement", icon: CreditCard },
  { l: "Aide", h: "/dashboard/aide", icon: LifeBuoy },
];

/* Barre du bas mobile : 6 onglets ne tiennent pas, on garde les 4
   sur lesquels le vendeur passe sa journée. */
const NAV_MOBILE = [NAV[0], NAV[1], NAV[2], NAV[3]];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Guard>
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </Guard>
    </AuthProvider>
  );
}

/* Protège l'espace vendeur. En mode démo (pas de Supabase), on laisse passer
   pour que le projet reste utilisable sans backend. */
function Guard({ children }: { children: React.ReactNode }) {
  const { user, loading, demoMode } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && !demoMode) router.replace("/connexion");
  }, [loading, user, demoMode, router]);

  if (loading) return <LoadingScreen label="Vérification de ta session…" />;
  if (!user && !demoMode) return <LoadingScreen label="Redirection…" />;
  return <>{children}</>;
}

function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { config, palette, ready, hasShop } = useStore();
  const { signOut, demoMode, user } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (demoMode) {
      setIsAdmin(true); // en démo, on montre l'onglet pour qu'il soit explorable
      return;
    }
    const sb = supabase();
    if (!sb || !user) return;
    sb.from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }: any) => setIsAdmin(Boolean(data?.is_admin)));
  }, [demoMode, user]);

  const nav = isAdmin ? [...NAV, { l: "Admin", h: "/dashboard/admin", icon: Shield }] : NAV;

  /* Vendeur connecté mais sans boutique : on l'envoie créer la sienne */
  useEffect(() => {
    if (ready && !hasShop && !demoMode) router.replace("/creer");
  }, [ready, hasShop, demoMode, router]);

  if (!ready) return <LoadingScreen label="Chargement de ta boutique…" />;

  return (
    <div className="min-h-screen bg-cream">
      <OfflineBanner />

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-ink/5 bg-white px-4 py-6 lg:flex">
        <div className="px-2">
          <BoutikLogo className="h-7" />
        </div>

        <div className="mt-6 flex items-center gap-2.5 rounded-xl bg-cream px-3 py-2.5">
          <ShopLogo
            logo={config.logo}
            icon={config.logoIcon}
            name={config.name}
            accent={palette.accent}
            size={32}
          />
          <div className="min-w-0">
            <p className="truncate text-xs font-bold">{config.name || "Ma boutique"}</p>
            <p className="flex items-center gap-1 text-[10px] text-ink/45">
              <span
                className={`h-1.5 w-1.5 rounded-full ${config.published ? "bg-primary" : "bg-ink/25"}`}
              />
              {config.published ? "En ligne" : "Brouillon"}
            </p>
          </div>
        </div>

        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {nav.map((n) => {
            const active = path === n.h;
            return (
              <Link
                key={n.h}
                href={n.h}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  active ? "bg-primary-soft text-primary-dark" : "text-ink/60 hover:bg-cream hover:text-ink"
                }`}
              >
                <n.icon size={17} /> {n.l}
              </Link>
            );
          })}
        </nav>

        <div className="rounded-2xl bg-ink p-4 text-white">
          <p className="text-xs font-bold uppercase tracking-wider text-mango">
            Offre {config.plan}
          </p>
          <Link
            href="/dashboard/abonnement"
            className="btn mt-3 w-full bg-mango py-2 text-xs font-bold text-ink hover:bg-white"
          >
            Gérer mon abonnement
          </Link>
        </div>

        {!demoMode && (
          <button
            onClick={async () => {
              await signOut();
              router.replace("/connexion");
            }}
            className="mt-3 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-ink/45 transition-colors hover:bg-cream hover:text-ink"
          >
            <LogOut size={13} /> Se déconnecter
          </button>
        )}
      </aside>

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-ink/5 bg-white/85 px-4 py-3 backdrop-blur-md lg:hidden">
        <BoutikLogo className="h-6" />
        <Link href="/boutique" className="btn-ghost btn-sm">
          Voir ma boutique
        </Link>
      </header>

      <div className="lg:pl-60">
        <div className="mx-auto max-w-5xl px-4 pb-28 pt-6 lg:px-8 lg:pb-12">{children}</div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/5 bg-white/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-md justify-around py-2">
          {NAV_MOBILE.map((n) => {
            const active = path === n.h;
            return (
              <Link
                key={n.l}
                href={n.h}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-bold ${
                  active ? "text-primary" : "text-ink/45"
                }`}
              >
                <n.icon size={19} /> {n.l}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
