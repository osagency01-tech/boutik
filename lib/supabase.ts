"use client";

import { createBrowserClient } from "@supabase/ssr";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(URL && KEY);

let client: ReturnType<typeof createBrowserClient> | null = null;

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

/* Client navigateur. createBrowserClient (@supabase/ssr) gère lui-même
   la persistance de session via cookies : on ne lui impose PAS de storage
   personnalisé, car cela empêchait l'écriture de la session (cause du bug
   où l'utilisateur semblait connecté mais chaque requête partait sans
   token → auth.uid() null → erreurs 403 / RLS). */
export function supabase() {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createBrowserClient(URL!, KEY!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
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

export const STATUS_LABEL: Record<DbOrderStatus, string> = {
  nouvelle: "Nouvelle",
  paiement_demande: "Paiement demandé",
  payee: "Payée",
  preparation: "Préparation",
  expediee: "Expédiée",
  livree: "Livrée",
  annulee: "Annulée",
};

export const STATUS_ORDER: DbOrderStatus[] = [
  "nouvelle",
  "paiement_demande",
  "payee",
  "preparation",
  "expediee",
  "livree",
];

export function storageUrl(bucket: string, path: string | null | undefined) {
  if (!path) return undefined;
  if (path.startsWith("data:") || path.startsWith("http")) return path;
  return `${URL}/storage/v1/object/public/${bucket}/${path}`;
}

export function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 30);
}