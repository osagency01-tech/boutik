"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { PRODUCTS, type Product } from "./data";
import { getPalette, type Palette } from "./palettes";
import { TEMPLATE_INFO, templateTier, type TemplateId, type Tier } from "./templates";

export { TEMPLATE_INFO, templateTier };
export type { TemplateId, Tier };
import * as api from "./api";
import { demoShopToConfig, demoShopToProducts } from "./demo-shops";
import { isSupabaseConfigured, supabase } from "./supabase";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type Zone = { zone: string; price: number; delay: string };

export type Plan = "Gratuit" | "Starter" | "Business" | "Premium";

export type ShopConfig = {
  /* Slug réel en base (shops.slug) : c'est le SEUL identifiant fiable
     pour composer le lien public boutik-app.com/b/<slug>. Il ne
     correspond pas forcément à une re-translittération du nom actuel
     (immuable après publication, suffixe anti-collision possible à la
     création) — ne jamais le recalculer côté client. Absent en mode
     démo (localStorage), il n'existe pas encore de boutique réelle. */
  slug?: string;
  name: string;
  tagline: string;
  logo?: string;
  logoIcon: string;
  /* Image de fond de la grande bannière d'accueil (modèles classique,
     food, modern). Optionnelle : sans elle, la bannière reste au
     dégradé de couleur uni, comme avant. */
  bannerImage?: string;
  palette: string;
  template: TemplateId;
  bannerBadge: string;
  bannerTitle: string;
  bannerSubtitle: string;
  whatsapp: string;
  phone: string;
  instagram: string;
  hours: string;
  about: string;
  zones: Zone[];
  /* Textes de section, tous éditables par le vendeur */
  ctaLabel: string;
  featuredTitle: string;
  featuredEyebrow: string;
  perks: string[];
  deliveryNote: string;
  /* Moyens de paiement : coordonnées Mobile Money envoyées au client
     dans le message automatique de confirmation, et mode global de la
     boutique (jamais un choix par commande). */
  paymentMethod: string;
  paymentNumber: string;
  paymentAccountName: string;
  paymentInstructions: string;
  paymentMode: "avant" | "livraison";
  plan: Plan;
  published: boolean;
};

/* Ce que chaque offre débloque */
export const TIER_ACCESS: Record<Plan, Tier[]> = {
  Gratuit: ["Starter"],
  Starter: ["Starter"],
  Business: ["Starter", "Business"],
  Premium: ["Starter", "Business", "Premium"],
};

export const canUseTemplate = (plan: Plan, id: TemplateId) =>
  TIER_ACCESS[plan].includes(templateTier(id));

/* Photos par produit selon l'offre.
   Ce n'est pas le stockage qui contraint (une photo compressée pèse
   ~120 Ko) mais l'EGRESS : 5 Go/mois sur le plan Supabase gratuit.
   Chaque visite de fiche produit télécharge ses photos. */
export const PLAN_PHOTOS: Record<Plan, number> = {
  Gratuit: 1,
  Starter: 1,
  Business: 3,
  Premium: 5,
};

export const PLAN_QUOTA: Record<Plan, number> = {
  Gratuit: 3,
  Starter: 10,
  Business: 50,
  Premium: Infinity,
};

/* ------------------------------------------------------------------ */
/*  Valeurs par défaut (boutique démo)                                 */
/* ------------------------------------------------------------------ */

export const DEFAULT_CONFIG: ShopConfig = {
  name: "Kadi Store",
  tagline: "Mode, wax & artisanat — Abidjan",
  logoIcon: "shirt",
  palette: "terracotta",
  template: "classique",
  bannerBadge: "Nouvelle collection",
  bannerTitle: "Le wax qui fait tourner les têtes.",
  bannerSubtitle:
    "Pièces cousues main à Abidjan, karité et huiles de nos coopératives. Livraison partout en Côte d'Ivoire.",
  whatsapp: "2250700000000",
  phone: "+225 07 00 00 00 00",
  instagram: "@kadistore.ci",
  hours: "Lun–Sam, 8 h – 19 h",
  about:
    "Depuis 2019, Kadi Store sélectionne des pièces en wax et des créations artisanales auprès d'ateliers d'Abidjan et de Bouaké. Chaque article est vérifié à la main avant expédition.",
  zones: [
    { zone: "Abidjan — Cocody, Plateau, Marcory", price: 1000, delay: "24 h" },
    { zone: "Abidjan — autres communes", price: 1500, delay: "24–48 h" },
    { zone: "Intérieur du pays", price: 3000, delay: "2–4 jours" },
  ],
  ctaLabel: "Découvrir la boutique",
  featuredEyebrow: "Sélection",
  featuredTitle: "Nos coups de cœur",
  perks: ["Livraison 24 h à Abidjan", "Articles vérifiés à la main", "Réponse WhatsApp en 1 h"],
  deliveryNote:
    "Paiement à la livraison ou par Mobile Money avant expédition. Vérifie ton article devant le livreur : échange sous 48 h en cas de défaut.",
  paymentMethod: "MTN MoMo",
  paymentNumber: "97 00 00 00",
  paymentAccountName: "Kadi Store",
  paymentInstructions: "",
  paymentMode: "livraison",
  plan: "Business",
  published: true,
};

/* ------------------------------------------------------------------ */
/*  Contexte                                                           */
/* ------------------------------------------------------------------ */

type StoreCtx = {
  config: ShopConfig;
  palette: Palette;
  setConfig: (patch: Partial<ShopConfig>) => void;
  products: Product[];
  addProduct: (p: Omit<Product, "id">) => boolean;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  duplicateProduct: (id: string) => boolean;
  moveProduct: (id: string, dir: -1 | 1) => void;
  /* Remplacement direct : utilisé par les pages d'aperçu public,
     qui injectent une boutique de démonstration. */
  setProducts: (ps: Product[]) => void;
  quota: number;
  /** Photos autorisées par produit selon l'offre. */
  photoQuota: number;
  ready: boolean;
  resetDemo: () => void;
  startFresh: () => void;
  /* Préfixe des routes internes de la boutique (produits, panier, commande…).
     "/boutique" par défaut (aperçu vendeur), "/b/<slug>" pour une boutique
     publique, "/demo" pour la boutique de démonstration. */
  basePath: string;
  /* --- backend --- */
  shopId: string | null;
  demoMode: boolean;
  error: string | null;
  saveState: "idle" | "saving" | "saved" | "error";
  reload: () => Promise<void>;
  createShopFromConfig: () => Promise<void>;
  hasShop: boolean;
};

/* Envoie un data: URI (photo choisie par le vendeur, encodée en base64
   par fileToDataUrl) vers le Storage : jamais de base64 en base. Utilisé
   pour le logo/la bannière comme pour les photos produit — `path` sert
   aux tables qui référencent le fichier (product_images), `url` est ce
   qu'on affiche. */
async function uploadDataUri(
  bucket: "shop-logos" | "product-images",
  shopId: string,
  dataUri: string,
  name: string
): Promise<{ path: string; url: string }> {
  const blob = await (await fetch(dataUri)).blob();
  const path = await api.uploadImage(bucket, shopId, blob, name);
  return { path, url: api.publicImageUrl(bucket, path) };
}

const Ctx = createContext<StoreCtx | null>(null);
const KEY = "boutik-store-v1";

export function StoreProvider({
  children,
  slug,
  demo,
  demoTemplate,
  basePath = "/boutique",
  initialConfig,
  initialProducts,
  initialShopId,
}: {
  children: React.ReactNode;
  /* Si fourni : on charge la boutique publique de ce slug (vitrine).
     Sinon : la boutique du vendeur connecté (dashboard). */
  slug?: string;
  /* Aperçu public d'un modèle : la boutique est injectée par la page,
     on ne touche JAMAIS à la base. Sans ce garde-fou, l'aperçu
     affichait la boutique d'un vrai vendeur. */
  demo?: boolean;
  /* Avec `demo` : quel modèle de démonstration charger automatiquement
     (config + produits + vraies photos). Sans ce prop, `demo` seul
     attend que la page injecte tout elle-même (cas de /apercu). */
  demoTemplate?: TemplateId;
  basePath?: string;
  /* Données déjà chargées par un Server Component (app/demo,
     app/b/[slug]) : le premier rendu envoyé au navigateur contient
     déjà la vraie boutique, au lieu d'un écran "chargement…" suivi
     d'un second rendu une fois l'effet client exécuté — c'est ce qui
     gonflait le LCP de ces pages. /boutique (aperçu du vendeur
     connecté) ne les fournit jamais : elle a besoin de la session. */
  initialConfig?: Partial<ShopConfig>;
  initialProducts?: Product[];
  initialShopId?: string;
}) {
  const seeded = Boolean(initialConfig);
  /* Le Server Component ne peut pas importer DEFAULT_CONFIG lui-même :
     lib/store.tsx est "use client", et un import de valeur (pas un type)
     depuis un module "use client" dans un Server Component ne donne pas
     la vraie donnée. Le complètement avec DEFAULT_CONFIG se fait donc
     ici — /demo (config partielle) comme /b/[slug] (config déjà
     complète, ce merge est alors un no-op). */
  const [config, setConfigState] = useState<ShopConfig>(() =>
    initialConfig ? { ...DEFAULT_CONFIG, ...initialConfig } : DEFAULT_CONFIG
  );
  const [products, setProducts] = useState<Product[]>(() => initialProducts ?? PRODUCTS);
  const [ready, setReady] = useState(seeded);
  const [shopId, setShopId] = useState<string | null>(initialShopId ?? null);
  const [hasShop, setHasShop] = useState(seeded);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const demoMode = !isSupabaseConfigured;

  /* En mode démo, la file d'écriture n'existe pas : tout est local. */
  const pending = useRef<Partial<ShopConfig>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = async () => {
    /* --- Déjà seedé par le serveur : rien à recharger. --- */
    if (seeded) return;

    /* --- Boutique de démo autonome (ex. /demo) : on injecte directement
       la config + les produits du modèle demandé, vraies photos incluses. */
    if (demo && demoTemplate) {
      setConfigState({ ...DEFAULT_CONFIG, ...demoShopToConfig(demoTemplate) });
      setProducts(demoShopToProducts(demoTemplate));
      setHasShop(true);
      setReady(true);
      return;
    }

    /* --- Aperçu de modèle : rien à charger, la page injecte tout --- */
    if (demo) {
      setHasShop(true);
      setReady(true);
      return;
    }

    /* --- Mode démo : localStorage, comme avant --- */
    if (demoMode) {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved.config) setConfigState({ ...DEFAULT_CONFIG, ...saved.config });
          if (Array.isArray(saved.products)) setProducts(saved.products);
        }
      } catch {}
      setHasShop(true);
      setReady(true);
      return;
    }

    /* --- Mode Supabase --- */
    try {
      setError(null);
      /* Borne l'attente : sur un réseau instable, une requête peut
         pendre sans jamais échouer. Mieux vaut un écran d'erreur
         avec un bouton « Réessayer » qu'un spinner éternel. */
      const withTimeout = <T,>(pr: Promise<T>, ms = 12000): Promise<T> =>
        Promise.race([
          pr,
          new Promise<T>((_, rej) =>
            setTimeout(() => rej(new Error("Délai dépassé")), ms)
          ),
        ]);

      const res = await withTimeout(
        slug ? api.fetchShopBySlug(slug) : api.fetchMyShop()
      );
      if (!res) {
        setHasShop(false);
        setReady(true);
        return;
      }
      setShopId(res.shop.id);
      setConfigState(api.shopToConfig(res.shop, res.zones));
      setProducts(await api.fetchProducts(res.shop.id));
      setHasShop(true);
    } catch (e: any) {
      setError(e?.message ?? "Chargement impossible");
    }
    setReady(true);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, demo]);

  /* Persistance locale (mode démo uniquement, jamais en aperçu) */
  useEffect(() => {
    if (!ready || !demoMode || demo) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ config, products }));
    } catch {
      /* quota localStorage dépassé : on garde l'état en mémoire */
    }
  }, [config, products, ready, demoMode]);

  /* Écriture différée : le vendeur tape, on n'envoie qu'après une pause.
     Sans ça, chaque frappe = une requête, insupportable en 3G. */
  const flush = async () => {
    if (demoMode || !shopId) return;
    const patch = pending.current;
    pending.current = {};
    if (!Object.keys(patch).length) return;

    setSaveState("saving");
    try {
      /* Comme pour une photo produit : on n'écrit jamais un data: URI en
         base, on l'envoie au Storage et on ne garde que le chemin/URL. */
      if (patch.logo?.startsWith("data:")) {
        const { url } = await uploadDataUri("shop-logos", shopId, patch.logo, "logo.jpg");
        patch.logo = url;
        setConfigState((c) => ({ ...c, logo: url }));
      }
      if (patch.bannerImage?.startsWith("data:")) {
        const { url } = await uploadDataUri("shop-logos", shopId, patch.bannerImage, "banner.jpg");
        patch.bannerImage = url;
        setConfigState((c) => ({ ...c, bannerImage: url }));
      }
      await api.updateShop(shopId, patch);
      if (patch.zones) await api.replaceZones(shopId, patch.zones);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1500);
    } catch {
      setSaveState("error");
    }
  };

  const setConfig = (patch: Partial<ShopConfig>) => {
    setConfigState((c) => ({ ...c, ...patch }));   // optimiste : l'UI répond tout de suite
    if (demoMode) return;
    pending.current = { ...pending.current, ...patch };
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 700);
  };

  const reload = async () => {
    setReady(false);
    await load();
  };

  const createShopFromConfig = async () => {
    const sb = supabase();
    if (!sb) return;
    /* getSession lit la session localement (fiable) au lieu de getUser qui
       fait un appel réseau à /auth/v1/user — appel qui échouait en 403 et
       cassait la création. L'id vient directement du token de session. */
    const { data } = await sb.auth.getSession();
    if (!data.session?.user) throw new Error("Non connecté");
    const shop = await api.createShop(config, data.session.user.id);
    setShopId(shop.id);
    setHasShop(true);
    /* Le lien réel peut différer du nom si un autre vendeur avait déjà
       ce nom (voir createShop) : on le reflète ici pour que l'écran de
       fin du wizard puisse afficher le vrai lien, pas une supposition. */
    setConfigState((c) => ({ ...c, slug: shop.slug }));
    if (config.zones.length) await api.replaceZones(shop.id, config.zones);
  };

  const quota = PLAN_QUOTA[config.plan];
  const photoQuota = PLAN_PHOTOS[config.plan];
  const palette = getPalette(config.palette);

  const addProduct = (p: Omit<Product, "id">) => {
    if (products.length >= quota) return false;

    if (demoMode) {
      const id =
        p.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
          .slice(0, 40) +
        "-" +
        Math.random().toString(36).slice(2, 6);
      setProducts((ps) => [{ ...p, id }, ...ps]);
      return true;
    }

    if (!shopId) return false;
    /* Écriture serveur : c'est la base qui fait autorité sur le quota.
       On insère localement le produit retourné plutôt que de recharger
       tout le catalogue — une requête de moins par ajout. */
    (async () => {
      try {
        setSaveState("saving");
        const row = await api.insertProduct(shopId, p, products.length);
        let image = p.image;
        if (p.image?.startsWith("data:")) {
          const { path, url } = await uploadDataUri("product-images", shopId, p.image, `${row.id}.jpg`);
          await api.setProductImage(shopId, row.id, path);
          image = url;
        }
        setProducts((ps) => [
          { ...p, id: row.id, image },
          ...ps.filter((x) => x.id !== row.id),
        ]);
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 1500);
      } catch (e: any) {
        setSaveState("error");
        if (e?.message === "QUOTA") setError("QUOTA");
      }
    })();
    return true;
  };

  const updateProduct = (id: string, patch: Partial<Product>) => {
    setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    if (demoMode || !shopId) return;
    (async () => {
      try {
        setSaveState("saving");
        await api.patchProduct(id, patch);
        if (patch.image?.startsWith("data:")) {
          const { path, url } = await uploadDataUri("product-images", shopId, patch.image, `${id}.jpg`);
          await api.setProductImage(shopId, id, path);
          /* On met à jour localement l'URL de l'image au lieu de
             retélécharger tout le catalogue. */
          setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, image: url } : p)));
        }
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 1500);
      } catch {
        setSaveState("error");
      }
    })();
  };

  const deleteProduct = (id: string) => {
    const backup = products;
    setProducts((ps) => ps.filter((p) => p.id !== id));
    if (demoMode) return;
    api.removeProduct(id).catch(() => {
      setProducts(backup);      // rollback si le serveur refuse
      setSaveState("error");
    });
  };

  /* Dupliquer : gain de temps réel quand on vend des variantes
     d'un même article (mêmes photos, prix proche). */
  const duplicateProduct = (id: string) => {
    if (products.length >= quota) return false;
    const src = products.find((p) => p.id === id);
    if (!src) return false;
    const copy: Product = {
      ...src,
      id: src.id.replace(/-[a-z0-9]{4}$/, "") + "-" + Math.random().toString(36).slice(2, 6),
      name: src.name + " (copie)",
      featured: false,
    };
    if (demoMode) {
      setProducts((ps) => {
        const i = ps.findIndex((p) => p.id === id);
        const next = [...ps];
        next.splice(i + 1, 0, copy);
        return next;
      });
      return true;
    }
    const { id: _drop, ...payload } = copy;
    return addProduct(payload as Omit<Product, "id">);
  };

  /* L'ordre compte : c'est celui de la boutique. */
  const moveProduct = (id: string, dir: -1 | 1) => {
    setProducts((ps) => {
      const i = ps.findIndex((p) => p.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= ps.length) return ps;
      const next = [...ps];
      [next[i], next[j]] = [next[j], next[i]];
      if (!demoMode) api.reorderProducts(next.map((x) => x.id)).catch(() => setSaveState("error"));
      return next;
    });
  };

  const resetDemo = () => {
    setConfigState(DEFAULT_CONFIG);
    setProducts(PRODUCTS);
  };

  /* Vide la boutique de démo : le vendeur repart de zéro. */
  const startFresh = () => {
    setProducts([]);
    setConfigState({
      ...DEFAULT_CONFIG,
      name: "",
      tagline: "",
      about: "",
      logo: undefined,
      bannerBadge: "Nouveautés",
      bannerTitle: "Bienvenue dans ma boutique",
      bannerSubtitle: "Découvrez ma sélection. Commande directe sur WhatsApp.",
      featuredEyebrow: "Sélection",
      featuredTitle: "Nos produits",
      perks: ["Livraison rapide", "Produits vérifiés", "Réponse WhatsApp rapide"],
      whatsapp: "",
      phone: "",
      instagram: "",
      plan: "Gratuit",
      published: false,
    });
  };

  return (
    <Ctx.Provider
      value={{ config, palette, setConfig, products, setProducts, addProduct, updateProduct, deleteProduct, duplicateProduct, moveProduct, quota, photoQuota, ready, resetDemo, startFresh,
        shopId, demoMode, error, saveState, reload, createShopFromConfig, hasShop, basePath }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useStore = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
};

/* Vue vitrine : uniquement ce que le client doit voir.
   Le dashboard utilise useStore() et voit tout, y compris les masqués. */
export const useShopProducts = () => {
  const { products } = useStore();
  return products.filter((p) => !p.hidden);
};

/* Redimensionne une image uploadée en dataURL compact (max 900 px, JPEG 82 %) */
export function fileToDataUrl(file: File, maxPx = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    /* L'extension ment : un .php renommé .jpg passerait le filtre
       du navigateur. On vérifie que le fichier est bien une image
       avant de le traiter. Supabase Storage revérifie côté serveur. */
    if (!file.type.startsWith("image/")) {
      reject(new Error("Ce fichier n'est pas une image."));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error("Image trop lourde (8 Mo maximum)."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lecture impossible"));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = maxPx;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const cx = canvas.getContext("2d");
        if (!cx) return reject(new Error("Canvas indisponible"));
        cx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => reject(new Error("Image invalide"));
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}