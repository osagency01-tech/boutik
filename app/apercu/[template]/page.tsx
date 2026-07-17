"use client";

import ShopHome from "@/app/boutique/page";
import { demoImage, getDemoShop } from "@/lib/demo-shops";
import { TEMPLATE_INFO, useStore } from "@/lib/store";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/* Le visiteur clique un template sur la landing et le voit en vrai,
   avec les produits de démo. Une bande en bas permet de sauter d'un
   modèle à l'autre sans revenir en arrière. */
export default function TemplatePreview() {
  const { template } = useParams<{ template: string }>();
  const { setConfig, setProducts } = useStore();
  const router = useRouter();

  const info = TEMPLATE_INFO.find((t) => t.id === template);

  /* Charge la boutique de démo correspondante : nom, palette, textes
     ET produits. Montrer neuf fois Kadi Store en neuf couleurs ne
     prouverait rien au visiteur. */
  useEffect(() => {
    if (!info) return;
    const demo = getDemoShop(info.id);
    setConfig({
      template: info.id,
      name: demo.name,
      tagline: demo.tagline,
      logoIcon: demo.logoIcon,
      logo: undefined,
      palette: demo.palette,
      bannerBadge: demo.badge,
      bannerTitle: demo.title,
      bannerSubtitle: demo.subtitle,
      ctaLabel: demo.cta,
      perks: demo.perks,
      about: demo.about,
      featuredEyebrow: "Sélection",
      featuredTitle: "Nos produits",
    });
    setProducts(
      demo.products.map((pr, i) => ({
        id: `demo-${info.id}-${i}`,
        name: pr.name,
        price: pr.price,
        oldPrice: pr.oldPrice,
        category: pr.category,
        stock: 10,
        icon: pr.icon,
        image: demoImage(info.id, i),
        description: pr.desc,
        featured: i < 4,
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template]);

  useEffect(() => {
    if (!info) router.replace("/");
  }, [info, router]);

  if (!info) return null;

  const idx = TEMPLATE_INFO.findIndex((t) => t.id === info.id);
  const prev = TEMPLATE_INFO[(idx - 1 + TEMPLATE_INFO.length) % TEMPLATE_INFO.length];
  const next = TEMPLATE_INFO[(idx + 1) % TEMPLATE_INFO.length];

  return (
    <>
      <ShopHome />

      {/* Barre d'aperçu : toujours visible, ne masque pas le contenu */}
      <motion.div
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.3, type: "spring", damping: 24 }}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-white/95 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link
            href={`/apercu/${prev.id}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/10 text-ink/50 transition-colors hover:border-ink/40 hover:text-ink"
            aria-label={`Voir le modèle ${prev.name}`}
          >
            <ArrowLeft size={15} />
          </Link>

          <div className="min-w-0 flex-1 text-center">
            <p className="truncate font-display text-sm font-extrabold">
              {info.name}
              <span className="ml-2 rounded-full bg-cream px-2 py-0.5 text-[10px] font-bold text-ink/50">
                {info.tier}
              </span>
            </p>
            <p className="truncate text-[11px] text-ink/45">
              Modèle {idx + 1} sur {TEMPLATE_INFO.length} · aperçu avec des produits d&apos;exemple
            </p>
          </div>

          <Link
            href={`/apercu/${next.id}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/10 text-ink/50 transition-colors hover:border-ink/40 hover:text-ink"
            aria-label={`Voir le modèle ${next.name}`}
          >
            <ArrowRight size={15} />
          </Link>

          <Link href="/creer" className="btn-primary btn-sm shrink-0">
            <Check size={14} /> <span className="hidden sm:inline">Choisir</span>
          </Link>
        </div>
      </motion.div>

      {/* Espace pour que la barre ne recouvre pas le pied de page */}
      <div className="h-16" />
    </>
  );
}
