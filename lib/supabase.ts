"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { storageUrl } from "./storage-url";

export { storageUrl };

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(URL && KEY);

let client: SupabaseClient | null = null;

const REMEMBER_KEY = "boutik-remember";

export const setRemember = (v: boolean) => {
  try {
    localStorage.setItem(REMEMBER_KEY, v ? "1" : "0");
  } catch {}
};

export const getRemember = () => {
  try {
    return localStorage.getItem(REMEMBER_KEY) !== "0";
  } catch {
    return true;
  }
};

export function supabase() {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(URL!, KEY!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "boutik-auth",
      },
    });
  }
  return client;
}

export type DbPlan = "gratuit" | "starter" | "business" | "premium";
export type DbShopStatus = "brouillon" | "active" | "grace" | "suspendue" | "bannie";
export type DbOrderStatus =
  | "nouvelle"
  | "paiement_demande"
  | "payee"
  | "preparation"
  | "expediee"
  | "livree"
  | "annulee";

export type DbShop = {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  tagline: string | null;
  logo_path: string | null;
  logo_icon: string;
  banner_image_path: string | null;
  about: string | null;
  palette: string;
  template: string;
  banner_badge: string | null;
  banner_title: string | null;
  banner_subtitle: string | null;
  cta_label: string | null;
  featured_eyebrow: string | null;
  featured_title: string | null;
  perks: string[];
  delivery_note: string | null;
  whatsapp: string | null;
  phone: string | null;
  instagram: string | null;
  hours: string | null;
  payment_method: string | null;
  payment_number: string | null;
  payment_account_name: string | null;
  payment_instructions: string | null;
  payment_mode: "avant" | "livraison";
  plan: DbPlan;
  status: DbShopStatus;
  published_at: string | null;
};

export type DbProduct = {
  id: string;
  shop_id: string;
  name: string;
  description: string | null;
  category: string | null;
  icon: string;
  price: number;
  old_price: number | null;
  stock: number | null;
  sizes: string[];
  featured: boolean;
  hidden: boolean;
  position: number;
};

export type DbZone = {
  id: string;
  shop_id: string;
  label: string;
  price: number;
  delay: string | null;
  position: number;
};

export type DbOrder = {
  id: string;
  shop_id: string;
  reference: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  customer_note: string | null;
  zone_label: string | null;
  delivery_fee: number;
  subtotal: number;
  total: number;
  status: DbOrderStatus;
  created_at: string;
  order_items?: DbOrderItem[];
};

export type DbMessage = {
  id: string;
  shop_id: string;
  sender_name: string;
  sender_phone: string | null;
  sender_email: string | null;
  subject: string | null;
  body: string;
  read_at: string | null;
  created_at: string;
};

export type DbOrderItem = {
  id: string;
  order_id: string;
  shop_id: string;
  product_id: string | null;
  product_name: string;
  size: string | null;
  unit_price: number;
  quantity: number;
};

/* Trois étapes visibles au lieu de sept : "paiement demandé" et
   "préparation"/"expédiée" n'apportaient rien que le vendeur agissait
   vraiment dessus. Les valeurs d'origine restent dans l'énum Postgres
   (impossible à retirer proprement sans risquer des commandes déjà
   enregistrées dans ces statuts) — seuls le libellé et la progression
   affichés au vendeur sont simplifiés, voir simplifyStatus ci-dessous. */
export const STATUS_LABEL: Record<DbOrderStatus, string> = {
  nouvelle: "Commande en cours",
  paiement_demande: "Commande en cours",
  payee: "Commande validée",
  preparation: "Commande validée",
  expediee: "Commande validée",
  livree: "Commande livrée",
  annulee: "Annulée",
};

export const STATUS_ORDER: DbOrderStatus[] = ["nouvelle", "payee", "livree"];

/* Une commande déjà enregistrée avant cette simplification peut être
   dans un statut retiré de la progression (paiement_demande,
   preparation, expediee) : on la ramène à l'étape simplifiée la plus
   proche pour l'affichage et le bouton "étape suivante", sans jamais
   réécrire sa vraie valeur en base tant que le vendeur n'agit pas. */
export const simplifyStatus = (s: DbOrderStatus): DbOrderStatus => {
  if (s === "paiement_demande") return "nouvelle";
  if (s === "preparation" || s === "expediee") return "payee";
  return s;
};

export function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 30);
}