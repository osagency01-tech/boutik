"use client";

import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { useStore } from "@/lib/store";
import {
  ArrowRight,
  CreditCard,
  Image as ImageIcon,
  LifeBuoy,
  MessageCircle,
  Package,
  Palette,
  Share2,
  Smartphone,
  Store,
  UserPlus,
} from "lucide-react";
import Link from "next/link";

/* ------------------------------------------------------------------ *
 * Guide complet — "comment créer ma boutique"
 *
 * Le guide de démarrage (components/onboarding.tsx) coche des étapes
 * réelles au fil de l'avancement du vendeur, mais ne les EXPLIQUE pas
 * en détail. Cette page est le contraire : elle ne suit pas d'état,
 * elle raconte tout le parcours en clair, du compte à la première
 * commande, pour un vendeur qui préfère tout lire avant de commencer
 * (ou qui revient s'y référer plus tard).
 * ------------------------------------------------------------------ */

const STEPS = [
  {
    icon: UserPlus,
    title: "1. Crée ton compte",
    text: "Avec ton email et un mot de passe (ou directement avec Google). Un code de confirmation à 6 chiffres t'est envoyé par email — recopie-le pour activer ton compte.",
  },
  {
    icon: Store,
    title: "2. Donne un nom à ta boutique",
    text: "Choisis un nom, puis ce que tu vends et où (une catégorie, ton pays, ta ville) — ça devient la phrase affichée sous le nom de ta boutique.",
  },
  {
    icon: Palette,
    title: "3. Choisis ton style",
    text: "Un modèle (l'organisation de ta page) puis une palette de couleurs. Les deux se changent à tout moment ensuite, sans perdre tes produits.",
  },
  {
    icon: Smartphone,
    title: "4. Ajoute ton numéro WhatsApp",
    text: "C'est là que tes commandes arriveront, avec le bon de commande du client. On te le fait confirmer deux fois pour éviter une simple faute de frappe.",
  },
  {
    icon: ImageIcon,
    title: "5. Ajoute tes produits",
    text: "Depuis l'onglet Produits : une vraie photo (prise au téléphone suffit), un nom, un prix. Une boutique vide ne vend pas — vise au moins 3 produits pour commencer.",
  },
  {
    icon: CreditCard,
    title: "6. Publie ta boutique",
    text: "Depuis Mon abonnement : choisis une offre et règle par Mobile Money. Tant qu'elle n'est pas publiée, ta boutique n'est visible que par toi.",
  },
  {
    icon: Share2,
    title: "7. Partage ton lien",
    text: "boutik-app.com/b/ta-boutique — colle-le sur WhatsApp, Instagram, TikTok. C'est le seul moyen que tes clients arrivent chez toi : personne ne le devine tout seul.",
  },
  {
    icon: MessageCircle,
    title: "8. Reçois et gère tes commandes",
    text: "Chaque commande t'arrive sur WhatsApp. Marque-la « Payée » une fois réglée (ça met à jour ton stock automatiquement), puis suis-la jusqu'à la livraison depuis l'onglet Commandes.",
  },
];

export default function GuidePage() {
  const { hasShop, config } = useStore();

  return (
    <div>
      <Reveal>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">
          Comment créer ma boutique
        </h1>
        <p className="mt-1 text-sm text-ink/55">
          Les huit étapes, dans l&apos;ordre, du compte à la première commande. Tu peux
          revenir ici à tout moment.
        </p>
      </Reveal>

      <Stagger className="mt-6 space-y-3">
        {STEPS.map((s) => (
          <StaggerItem key={s.title}>
            <div className="card flex gap-4 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-dark">
                <s.icon size={18} />
              </span>
              <div className="min-w-0">
                <p className="font-display text-sm font-extrabold">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink/60">{s.text}</p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal delay={0.1}>
        <div className="card mt-5 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display font-extrabold">
              {hasShop ? `${config.name || "Ta boutique"} est déjà commencée` : "Prêt à commencer ?"}
            </p>
            <p className="mt-0.5 text-sm text-ink/55">
              {hasShop
                ? "Continue là où tu t'es arrêté."
                : "Les trois premières étapes prennent moins de 10 minutes."}
            </p>
          </div>
          <Link href={hasShop ? "/dashboard/produits" : "/creer"} className="btn-primary btn-md shrink-0">
            {hasShop ? "Ajouter mes produits" : "Créer ma boutique"} <ArrowRight size={15} />
          </Link>
        </div>

        <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-cream px-4 py-3 text-xs leading-relaxed shop-muted">
          <LifeBuoy size={15} className="shrink-0 text-ink/40" />
          <span>
            Une question précise, ou envie d&apos;une visite guidée interactive plutôt qu&apos;à lire ?
            Va dans{" "}
            <Link href="/dashboard/aide" className="font-bold underline">
              Aide &amp; support
            </Link>
            .
          </span>
        </div>
      </Reveal>
    </div>
  );
}
