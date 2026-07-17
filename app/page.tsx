"use client";

import { BoutikLogo } from "@/components/brand";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { WhatsAppIcon } from "@/components/phone-icon";
import dynamic from "next/dynamic";

/* Chargé après le premier rendu : le téléphone animé embarque Framer
   Motion (~115 Ko) pour son glissement au doigt. Le titre et le bouton
   d'inscription ne doivent pas attendre ça. */
const PhoneDemo = dynamic(() => import("@/components/phone-demo"), {
  ssr: false,
  loading: () => <PhoneSkeleton />,
});

function PhoneSkeleton() {
  return (
    <div className="mx-auto w-[290px] sm:w-[320px]">
      <div className="h-[560px] animate-pulse rounded-[2.4rem] bg-ink/5" />
    </div>
  );
}

/* Ne monte le téléphone animé que lorsqu'il approche de l'écran.
   Sans ça, Framer Motion (~53 Ko) est téléchargé dès l'arrivée sur la
   page, alors que sur mobile le composant est sous la ligne de
   flottaison — le visiteur ne le voit qu'après avoir défilé. */
function LazyPhone() {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          obs.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return <div ref={ref}>{near ? <PhoneDemo /> : <PhoneSkeleton />}</div>;
}
import ShopPreview from "@/components/shop-preview";
import { getDemoShop } from "@/lib/demo-shops";
import { PLANS, fcfa } from "@/lib/data";
import { TEMPLATE_INFO } from "@/lib/store";
import {
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  Eye,
  FileText,
  LayoutDashboard,
  Menu,
  Package,
  Smartphone,
  Store,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function Landing() {
  return (
    <main>
      <Header />
      <Hero />
      {/* Preuve immédiate : le visiteur voit de vraies boutiques sans
          défiler. Elles étaient à 4 écrans plus bas — donc jamais vues
          sur mobile. */}
      <ShopStrip />
      <Realities />
      <Templates />
      <HowItWorks />
      <Features />
      <Pricing />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  );
}

/* ---------------- Header ---------------- */

function Header() {
  const [open, setOpen] = useState(false);
  const links = [
    ["Comment ça marche", "#comment"],
    ["Templates", "#templates"],
    ["Fonctionnalités", "#fonctions"],
    ["Tarifs", "#tarifs"],
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-ink/5 bg-cream/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-medium text-ink/70 md:flex">
          {links.map(([l, h]) => (
            <a key={h} href={h} className="transition-colors hover:text-ink">
              {l}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/dashboard" className="btn-ghost btn-md">
            Espace vendeur
          </Link>
          <Link href="/boutique" className="btn-primary btn-md">
            Voir une boutique démo
          </Link>
        </div>
        <button
          className="rounded-lg p-2 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <nav className="animate-drop border-t border-ink/5 bg-cream px-4 pb-5 pt-3 md:hidden">
          <div className="flex flex-col gap-3 text-sm font-medium">
            {links.map(([l, h]) => (
              <a key={h} href={h} onClick={() => setOpen(false)} className="py-1">
                {l}
              </a>
            ))}
            <Link href="/boutique" className="btn-primary btn-md mt-2">
              Voir une boutique démo
            </Link>
            <Link href="/dashboard" className="btn-ghost btn-md">
              Espace vendeur
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <BoutikLogo className={`h-8 ${light ? "brightness-0 invert" : ""}`} />
  );
}

/* ---------------- Hero ---------------- */

function Hero() {
  return (
    <section className="wax-pattern relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-14 md:grid-cols-2 md:pt-20 lg:gap-8">
        <div>
          <Reveal>
            <span className="chip bg-primary-soft text-primary-dark">
              <WhatsAppIcon className="h-3.5 w-3.5" /> Discute moins, vends plus. Optimise ton temps.
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Ta boutique en ligne,
              <br />
              <span className="text-primary">prête en 10 minutes.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-ink/65">
              Crée ta boutique en quelques minutes, reçois tes
  commandes sans discuter, encaisse par Mobile Money.
  Pensé pour les vendeurs africains, depuis un téléphone.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/creer" className="btn-primary btn-lg">
                Créer ma boutique gratuitement <ArrowRight size={18} />
              </Link>
              <Link href="/boutique" className="btn-ghost btn-lg">
                Voir la démo
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.32}>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-ink/60">
              {["0 % de commission sur tes ventes", "Sans engagement", "À partir de 999 F/mois"].map(
                (t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <Check size={15} className="text-primary" /> {t}
                  </li>
                )
              )}
            </ul>
          </Reveal>
        </div>
        <Reveal delay={0.2} y={40}>
          <LazyPhone />
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Bandeau de boutiques ---------------- */

function ShopStrip() {
  return (
    <section className="border-y border-ink/5 bg-white py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-end justify-between gap-4 px-4">
          <div>
            <p className="section-eyebrow">Déjà en ligne</p>
            <h2 className="font-display text-xl font-extrabold sm:text-2xl">
              Des boutiques comme la tienne
            </h2>
          </div>
          <a
            href="#templates"
            className="shrink-0 text-xs font-bold text-primary hover:underline"
          >
            Voir les 9 modèles →
          </a>
        </div>

        {/* Défilement horizontal : le geste naturel sur mobile, et
            ça ne coûte aucune hauteur de page. */}
        <div className="nice-scroll flex gap-3 overflow-x-auto px-4 pb-2">
          {TEMPLATE_INFO.map((t) => {
            const demo = getDemoShop(t.id);
            return (
              <Link
                key={t.id}
                href={`/apercu/${t.id}`}
                className="group w-[190px] shrink-0 sm:w-[220px]"
              >
                <div className="overflow-hidden rounded-xl shadow-card transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lift">
                  <ShopPreview template={t.id} />
                </div>
                <p className="mt-2 truncate text-xs font-bold">{demo.name}</p>
                <p className="truncate text-[11px] text-ink/45">
                  {demo.tagline.split("—")[0].trim()}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Réalités du marché ---------------- */

function Realities() {
  const items = [
    { icon: <WhatsAppIcon className="h-5 w-5" />, t: "Tes commandes sur WhatsApp", d: "Chaque commande arrive là où tu travailles déjà. Les questions, elles, restent dans ton espace vendeur." },
    { icon: <Wallet size={20} />, t: "Mobile Money", d: "Wave, Orange Money, MTN MoMo : tes clients paient comme d'habitude." },
    { icon: <Smartphone size={20} />, t: "100 % mobile", d: "Boutique et gestion pensées pour le téléphone, légères même en 3G." },
    { icon: <FileText size={20} />, t: "Confiance", d: "Bons de commande PDF automatiques : tes clients savent à qui ils achètent." },
  ];
  return (
    <section className="border-y border-ink/5 bg-white">
      <Stagger className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it) => (
          <StaggerItem key={it.t}>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
              {it.icon}
            </div>
            <h3 className="mt-4 font-display text-lg font-bold">{it.t}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{it.d}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

/* ---------------- Comment ça marche ---------------- */

function HowItWorks() {
  const steps = [
    {
      n: "1",
      t: "Crée ta boutique",
      d: "Choisis un template, ajoute ton logo, tes couleurs et tes produits. Aucune compétence technique nécessaire.",
    },
    {
      n: "2",
      t: "Partage ton lien",
      d: "Ta boutique a sa propre adresse : ta-boutique.boutik-app.com. Partage-la sur WhatsApp, Facebook, TikTok.",
    },
    {
      n: "3",
      t: "Reçois tes commandes",
      d: "Chaque commande arrive sur ton WhatsApp avec un bon de commande PDF, et dans ton espace vendeur.",
    },
  ];
  return (
    <section id="comment" className="mx-auto max-w-6xl px-4 py-20 md:py-24">
      <Reveal>
        <p className="section-eyebrow">Comment ça marche</p>
        <h2 className="max-w-xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          De zéro à ta première commande, en trois étapes.
        </h2>
      </Reveal>
      <Stagger className="mt-12 grid gap-6 md:grid-cols-3" gap={0.12}>
        {steps.map((s) => (
          <StaggerItem key={s.n}>
            <div className="card group h-full p-7 transition-shadow duration-300 hover:shadow-lift">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-mango font-display text-lg font-extrabold text-ink transition-transform duration-300 group-hover:scale-110">
                {s.n}
              </span>
              <h3 className="mt-5 font-display text-xl font-bold">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/60">{s.d}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

/* ---------------- Templates ---------------- */

function Templates() {
  const tiers = ["Starter", "Business", "Premium"] as const;
  const tierChip: Record<string, string> = {
    Starter: "bg-primary-soft text-primary-dark",
    Business: "bg-mango-soft text-yellow-800",
    Premium: "bg-ink text-white",
  };
  const tierBg: Record<string, string> = {
    Starter: "#E3F2EA",
    Business: "#FDF3DC",
    Premium: "#EEF0ED",
  };
  const tierAccent: Record<string, string> = {
    Starter: "#0E8A52",
    Business: "#D97706",
    Premium: "#14231B",
  };
  return (
    <section id="templates" className="border-y border-ink/5 bg-white py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal>
          <p className="section-eyebrow">9 templates</p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="max-w-xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Neuf boutiques, neuf métiers. Clique pour visiter.
            </h2>
            <Link href="/apercu/classique" className="btn-ghost btn-md shrink-0">
              Explorer le template Classique <ArrowRight size={15} />
            </Link>
          </div>
        </Reveal>
        <Stagger className="mt-12 grid gap-5 sm:grid-cols-3" gap={0.05}>
          {TEMPLATE_INFO.map((t) => (
            <StaggerItem key={t.id}>
              <Link
                href={`/apercu/${t.id}`}
                className="card group block h-full overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <div className="relative p-3" style={{ backgroundColor: tierBg[t.tier] }}>
                  <ShopPreview template={t.id} />
                  {/* Voile au survol : rend le clic découvrable */}
                  <div className="absolute inset-0 flex items-center justify-center bg-ink/0 opacity-0 transition-all duration-300 group-hover:bg-ink/50 group-hover:opacity-100">
                    <span className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-ink">
                      <Eye size={13} /> Visiter la boutique
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display font-bold">{t.name}</p>
                    <span className={`chip ${tierChip[t.tier]}`}>{t.tier}</span>
                  </div>
                  {/* Le métier de la boutique parle plus que le nom du modèle */}
                  <p className="mt-1 text-xs font-semibold text-ink/45">
                    Ex. {getDemoShop(t.id).name} — {getDemoShop(t.id).tagline.split("—")[0].trim()}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink/55">{t.desc}</p>
                  <p className="mt-2 flex items-center gap-1 text-xs font-bold text-primary sm:hidden">
                    Visiter <ArrowRight size={12} />
                  </p>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ---------------- Fonctionnalités ---------------- */

function Features() {
  const feats = [
    {
      icon: <Store size={20} />,
      t: "Boutique complète, 8 pages",
      d: "Accueil, catalogue, fiches produits, panier, commande, livraison, à propos, contact. Tout est déjà structuré.",
    },
    {
      icon: <LayoutDashboard size={20} />,
      t: "Espace vendeur clair",
      d: "Suis chaque commande de « Nouvelle » à « Livrée ». Fini les captures d'écran perdues dans les discussions.",
    },
    {
      icon: <FileText size={20} />,
      t: "Bons de commande PDF",
      d: "Générés automatiquement à chaque commande : numéro, produits, montant, adresse. Professionnel et rassurant.",
    },
    {
      icon: <Package size={20} />,
      t: "Stock maîtrisé",
      d: "Le stock se met à jour quand tu confirmes le paiement. Produit épuisé = commande bloquée automatiquement.",
    },
    {
      icon: <Bell size={20} />,
      t: "Notifications instantanées",
      d: "Une commande, une alerte. Sur ton téléphone, même l'application fermée, grâce à la technologie PWA.",
    },
    {
      icon: <Wallet size={20} />,
      t: "Abonnement Mobile Money",
      d: "Tu paies ton abonnement comme tes clients te paient : par Mobile Money, sans carte bancaire.",
    },
  ];
  return (
    <section id="fonctions" className="mx-auto max-w-6xl px-4 py-20 md:py-24">
      <Reveal>
        <p className="section-eyebrow">Fonctionnalités</p>
        <h2 className="max-w-xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Tout ce qu'il faut pour vendre sérieusement.
        </h2>
      </Reveal>
      <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" gap={0.07}>
        {feats.map((f) => (
          <StaggerItem key={f.t}>
            <div className="card h-full p-6 transition-shadow duration-300 hover:shadow-lift">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                {f.icon}
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">{f.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{f.d}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

/* ---------------- Tarifs ---------------- */

function Pricing() {
  return (
    <section id="tarifs" className="border-y border-ink/5 bg-white py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="text-center">
          <p className="section-eyebrow justify-center">Tarifs</p>
          <h2 className="mx-auto max-w-xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Simple, sans commission, sans surprise.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-ink/60">
            Commence gratuitement, publie quand tu es prêt. 0 % de commission
            sur tes ventes, quel que soit ton volume.
          </p>
        </Reveal>
        <Stagger className="mt-12 grid gap-6 md:grid-cols-3" gap={0.1}>
          {PLANS.map((p) => (
            <StaggerItem key={p.name} className="h-full">
              <div
                className={`relative flex h-full flex-col rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 ${
                  p.highlight
                    ? "bg-ink text-white shadow-lift"
                    : "card hover:shadow-lift"
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-mango px-3 py-1 text-xs font-bold text-ink">
                    {p.tag}
                  </span>
                )}
                <p className={`text-sm font-bold uppercase tracking-widest ${p.highlight ? "text-mango" : "text-primary"}`}>
                  {p.name}
                </p>
                <p className="mt-3 font-display text-4xl font-extrabold">
                  {fcfa(p.price)}
                  <span className={`text-base font-semibold ${p.highlight ? "text-white/50" : "text-ink/40"}`}>
                    {" "}/ mois
                  </span>
                </p>
                <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check
                        size={16}
                        className={`mt-0.5 shrink-0 ${p.highlight ? "text-mango" : "text-primary"}`}
                      />
                      <span className={p.highlight ? "text-white/85" : "text-ink/75"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/creer"
                  className={`${p.highlight ? "btn bg-mango text-ink hover:bg-white" : "btn-primary"} btn-md mt-7 w-full`}
                >
                  Choisir {p.name}
                </Link>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal delay={0.15}>
          <p className="mt-8 text-center text-sm text-ink/50">
            Compte gratuit : crée et personnalise ta boutique sans payer.
            L'abonnement n'est nécessaire que pour la publier.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */

function Faq() {
  const faqs = [
    {
      q: "Est-ce que je dois savoir coder ?",
      a: "Non. Tu choisis un template, tu ajoutes tes produits avec tes photos, et ta boutique est prête. Tout se fait depuis ton téléphone.",
    },
    {
      q: "Comment mes clients me paient-ils ?",
      a: "Directement entre vous, comme d'habitude : Wave, Orange Money, MTN MoMo ou espèces à la livraison. Boutik ne touche pas ton argent et ne prend aucune commission sur tes ventes.",
    },
    {
      q: "Que se passe-t-il si je ne renouvelle pas mon abonnement ?",
      a: "Ta boutique reste visible 7 jours (période de grâce), puis elle est mise en pause. Tes produits et tes données sont conservés 90 jours : dès que tu paies, tout revient instantanément.",
    },
    {
      q: "Mes clients doivent-ils créer un compte pour commander ?",
      a: "Non. Ils remplissent simplement leur nom, leur numéro WhatsApp et leur adresse. Moins il y a d'étapes, plus tu vends.",
    },
    {
      q: "Puis-je changer de template plus tard ?",
      a: "Oui, à tout moment et sans perdre ton contenu. Tes produits, textes et photos sont automatiquement adaptés au nouveau design.",
    },
    {
      q: "Comment je paie mon abonnement Boutik ?",
      a: "Par Mobile Money, directement depuis ton espace vendeur. Tu reçois un rappel WhatsApp 3 jours avant chaque échéance.",
    },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 md:py-24">
      <Reveal className="text-center">
        <p className="section-eyebrow justify-center">Questions fréquentes</p>
        <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          On répond à tout.
        </h2>
      </Reveal>
      <div className="mt-10 space-y-3">
        {faqs.map((f, i) => (
          <Reveal key={f.q} delay={i * 0.05}>
            <div className="card overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left font-semibold"
                aria-expanded={open === i}
              >
                {f.q}
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-ink/40 transition-transform duration-300 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`grid transition-all duration-300 ease-out ${
                  open === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-5 text-sm leading-relaxed text-ink/65">{f.a}</p>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------- CTA final + Footer ---------------- */

function FinalCta() {
  return (
    <section className="px-4 pb-20">
      <Reveal>
        <div className="wax-pattern-dense relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-ink px-6 py-16 text-center text-white md:py-20">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-mango/20 blur-3xl" />
          <h2 className="relative mx-auto max-w-2xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Ton commerce mérite mieux qu'un statut WhatsApp.
          </h2>
          <p className="relative mx-auto mt-4 max-w-md text-white/65">
            Crée ta boutique gratuitement aujourd'hui. Publie-la quand tu es
            prêt, à partir de {fcfa(999)}/mois.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/creer" className="btn bg-mango text-ink hover:bg-white btn-lg">
              Créer ma boutique <ArrowRight size={18} />
            </Link>
            <Link
              href="/boutique"
              className="btn border border-white/25 text-white hover:bg-white/10 btn-lg"
            >
              Voir la boutique démo
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-ink/5 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 sm:flex-row">
        <Logo />
        <p className="text-sm text-ink/50">
          © {new Date().getFullYear()} Boutik
        </p>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-medium text-ink/60">
          <a href="#tarifs" className="hover:text-ink">Tarifs</a>
          <Link href="/apercu/classique" className="hover:text-ink">Démo</Link>
          <Link href="/dashboard" className="hover:text-ink">Espace vendeur</Link>
          <Link href="/legal/cgu" className="hover:text-ink">CGU</Link>
          <Link href="/legal/confidentialite" className="hover:text-ink">Confidentialité</Link>
        </div>
      </div>
    </footer>
  );
}
