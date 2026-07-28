"use client";

import { Reveal } from "@/components/motion";
import { WhatsAppIcon } from "@/components/phone-icon";
import { ErrorScreen, SkeletonList } from "@/components/states";
import { fcfa, ORDERS as DEMO_ORDERS, STATUS_STYLE } from "@/lib/data";
import { useStore } from "@/lib/store";
import * as api from "@/lib/api";
import {
  STATUS_LABEL,
  STATUS_ORDER,
  simplifyStatus,
  type DbOrder,
  type DbOrderStatus,
} from "@/lib/supabase";
import type { ShopConfig } from "@/lib/store";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight, FileText, MapPin } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const FILTERS: ("Toutes" | DbOrderStatus)[] = ["Toutes", "nouvelle", "payee", "livree", "annulee"];

/* Les commandes de démo (lib/data.ts) sont converties au format base
   pour que l'écran soit identique avec ou sans Supabase. */
function demoToDb(): DbOrder[] {
  const map: Record<string, DbOrderStatus> = {
    "Commande en cours": "nouvelle",
    "Commande validée": "payee",
    "Commande livrée": "livree",
    Annulée: "annulee",
  };
  return DEMO_ORDERS.map((o, i) => ({
    id: String(i),
    shop_id: "demo",
    reference: o.id,
    customer_name: o.client,
    customer_phone: o.phone,
    customer_address: o.city,
    customer_note: null,
    zone_label: o.city,
    delivery_fee: 0,
    subtotal: o.items.reduce((s, x) => s + x.qty * x.price, 0),
    total: o.items.reduce((s, x) => s + x.qty * x.price, 0),
    status: map[o.status] ?? "nouvelle",
    created_at: new Date().toISOString(),
    order_items: o.items.map((x, j) => ({
      id: `${i}-${j}`,
      order_id: String(i),
      shop_id: "demo",
      product_id: null,
      product_name: x.name,
      size: null,
      unit_price: x.price,
      quantity: x.qty,
    })),
  }));
}

/* Message de confirmation envoyé au clic sur "Confirmer la commande" :
   le vendeur n'a plus à retaper ses coordonnées de paiement à chaque
   commande. Le contenu dépend du mode choisi une fois pour toutes dans
   Ma boutique/Paiement (jamais un choix laissé au client, qui n'aurait
   fait que multiplier les allers-retours WhatsApp). */
function confirmMessage(o: DbOrder, config: ShopConfig): string {
  const produits = (o.order_items ?? [])
    .map((i) => `• ${i.product_name}${i.size ? ` (${i.size})` : ""} × ${i.quantity} — ${fcfa(i.quantity * i.unit_price)}`)
    .join("\n");

  const intro = `Bonjour ${o.customer_name.split(" ")[0]} 👋\n\nVotre commande ${o.reference} chez ${config.name} est confirmée ✅\n\n📦 Commande :\n${produits}\n\n💰 Total :\n${fcfa(o.total)}`;

  if (config.paymentMode === "avant") {
    const method = config.paymentMethod || "Mobile Money";
    const lines = [
      `Pour finaliser votre commande, veuillez effectuer le paiement :`,
      ``,
      `📱 ${method}`,
      config.paymentNumber ? `Numéro : +${config.paymentNumber}` : null,
      config.paymentAccountName ? `Nom : ${config.paymentAccountName}` : null,
      config.paymentInstructions || null,
      ``,
      `Après paiement, envoyez la capture de paiement ici pour validation.`,
    ].filter((l) => l !== null);
    return `${intro}\n\n${lines.join("\n")}\n\nMerci pour votre confiance 🙏`;
  }

  return `${intro}\n\n🚚 Votre commande sera livrée à : ${o.customer_address ?? "l'adresse indiquée"}\n\n💵 Paiement à effectuer lors de la livraison.\n\nMerci pour votre confiance 🙏`;
}

export default function OrdersPage() {
  const { config, palette, shopId, demoMode } = useStore();
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Toutes");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    if (demoMode) {
      const d = demoToDb();
      setOrders(d);
      setOpenId(d[0]?.id ?? null);
      setLoading(false);
      return;
    }
    if (!shopId) return;
    try {
      const rows = await api.fetchOrders(shopId);
      setOrders(rows);
      setOpenId(rows[0]?.id ?? null);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [demoMode, shopId]);

  useEffect(() => {
    load();
  }, [load]);

  const advance = async (o: DbOrder) => {
    const i = STATUS_ORDER.indexOf(simplifyStatus(o.status));
    if (i < 0 || i >= STATUS_ORDER.length - 1) return;
    const next = STATUS_ORDER[i + 1];
    setOrders((os) => os.map((x) => (x.id === o.id ? { ...x, status: next } : x)));
    if (demoMode) return;
    try {
      await api.updateOrderStatus(o.id, next);
    } catch {
      setOrders((os) => os.map((x) => (x.id === o.id ? { ...x, status: o.status } : x)));
    }
  };

  /* "Confirmer la commande" envoie le message WhatsApp ET fait passer la
     commande au statut suivant, dans le même geste — avant ce correctif,
     le bouton n'était qu'un lien WhatsApp qui ne changeait jamais le
     statut, donc restait cliquable indéfiniment (une commande pouvait
     être "confirmée" plusieurs fois). */
  const confirmOrder = (o: DbOrder) => {
    const waUrl = `https://wa.me/${o.customer_phone.replace(/\D/g, "")}?text=${encodeURIComponent(
      confirmMessage(o, config)
    )}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
    advance(o);
  };

  if (error) return <ErrorScreen onRetry={load} />;

  const shown = orders.filter((o) => filter === "Toutes" || o.status === filter);

  return (
    <div>
      <Reveal>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Commandes</h1>
        <p className="mt-1 text-sm text-ink/55">
          Chaque changement de statut est enregistré. Le stock se met à jour au passage en
          « Payée ».
        </p>
      </Reveal>

      <div className="nice-scroll mt-5 flex gap-2 overflow-x-auto pb-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`chip shrink-0 border transition-all ${
              filter === f
                ? "border-ink bg-ink text-white"
                : "border-ink/15 bg-white text-ink/70 hover:border-ink/40"
            }`}
          >
            {f === "Toutes" ? "Toutes" : STATUS_LABEL[f]}
            {f !== "Toutes" && (
              <span className="opacity-60">{orders.filter((o) => o.status === f).length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-4">
          <SkeletonList rows={4} />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <AnimatePresence initial={false}>
            {shown.map((o) => {
              const open = openId === o.id;
              const stepIndex = STATUS_ORDER.indexOf(simplifyStatus(o.status));
              const next =
                stepIndex >= 0 && stepIndex < STATUS_ORDER.length - 1
                  ? STATUS_ORDER[stepIndex + 1]
                  : null;
              const items = o.order_items ?? [];
              return (
                <motion.div
                  key={o.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="card overflow-hidden"
                >
                  <button
                    onClick={() => setOpenId(open ? null : o.id)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                    aria-expanded={open}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold">
                        {o.reference}{" "}
                        <span className="font-semibold text-ink/60">· {o.customer_name}</span>
                      </p>
                      <p className="text-xs text-ink/55">
                        {new Date(o.created_at).toLocaleString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="hidden font-display font-extrabold sm:block">
                        {fcfa(o.total)}
                      </span>
                      <span className={`chip ${STATUS_STYLE[STATUS_LABEL[o.status] as never]}`}>
                        {STATUS_LABEL[o.status]}
                      </span>
                      <ChevronDown
                        size={17}
                        className={`text-ink/35 transition-transform duration-300 ${
                          open ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <div className="border-t border-ink/5 px-5 py-4">
                          {o.status !== "annulee" && (
                            <div className="nice-scroll flex items-center gap-1 overflow-x-auto pb-3">
                              {STATUS_ORDER.map((s, i) => (
                                <div key={s} className="flex shrink-0 items-center gap-1">
                                  <span
                                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                      i <= stepIndex ? "bg-primary text-white" : "bg-cream text-ink/50"
                                    }`}
                                  >
                                    {STATUS_LABEL[s]}
                                  </span>
                                  {i < STATUS_ORDER.length - 1 && (
                                    <ChevronRight size={11} className="text-ink/25" />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-xl bg-cream p-4">
                              <p className="text-xs font-bold uppercase tracking-wider text-ink/55">
                                Articles
                              </p>
                              <div className="mt-2 space-y-1.5 text-sm">
                                {items.map((i) => (
                                  <div key={i.id} className="flex justify-between gap-2">
                                    <span className="text-ink/75">
                                      {i.product_name}
                                      {i.size ? ` (${i.size})` : ""} × {i.quantity}
                                    </span>
                                    <span className="font-semibold">
                                      {fcfa(i.quantity * i.unit_price)}
                                    </span>
                                  </div>
                                ))}
                                {o.delivery_fee > 0 && (
                                  <div className="flex justify-between gap-2 text-ink/60">
                                    <span>Livraison</span>
                                    <span>{fcfa(o.delivery_fee)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between border-t border-ink/10 pt-1.5 font-extrabold">
                                  <span>Total</span>
                                  <span className="text-primary">{fcfa(o.total)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="rounded-xl bg-cream p-4 text-sm">
                              <p className="text-xs font-bold uppercase tracking-wider text-ink/55">
                                Client
                              </p>
                              <p className="mt-2 font-bold">{o.customer_name}</p>
                              <p className="text-ink/60">{o.customer_phone}</p>
                              {o.customer_address && (
                                <p className="mt-1 flex items-center gap-1 text-ink/60">
                                  <MapPin size={12} /> {o.customer_address}
                                </p>
                              )}
                              {o.customer_note && (
                                <p className="mt-2 rounded-lg bg-white p-2 text-xs italic text-ink/60">
                                  « {o.customer_note} »
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {next && (
                              <button onClick={() => advance(o)} className="btn-ink btn-sm">
                                Passer en « {STATUS_LABEL[next]} »
                              </button>
                            )}
                            {simplifyStatus(o.status) === "nouvelle" ? (
                              <button
                                onClick={() => confirmOrder(o)}
                                className="btn bg-[#25D366] px-4 py-2 text-xs text-white hover:bg-[#1fb958]"
                              >
                                <WhatsAppIcon className="h-3.5 w-3.5" /> Confirmer la commande
                              </button>
                            ) : (
                              <a
                                href={`https://wa.me/${o.customer_phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                                  `Bonjour ${o.customer_name.split(" ")[0]} 👋🏾 Concernant votre commande ${o.reference} chez ${config.name}.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn bg-[#25D366] px-4 py-2 text-xs text-white hover:bg-[#1fb958]"
                              >
                                <WhatsAppIcon className="h-3.5 w-3.5" /> Écrire au client
                              </a>
                            )}
                            <button
                              className="btn-ghost btn-sm"
                              onClick={async () => {
                                /* Import à la demande : jsPDF pèse ~130 Ko.
                                   Le charger au montage ralentirait la page
                                   pour tous les vendeurs, alors que peu
                                   téléchargent un PDF à chaque visite. */
                                const { downloadOrderPdf } = await import("@/lib/pdf");
                                downloadOrderPdf(config, palette, {
                                  reference: o.reference,
                                  date: new Date(o.created_at),
                                  customerName: o.customer_name,
                                  customerPhone: o.customer_phone,
                                  customerAddress: o.customer_address ?? undefined,
                                  customerNote: o.customer_note ?? undefined,
                                  zoneLabel: o.zone_label ?? undefined,
                                  deliveryFee: o.delivery_fee,
                                  items: items.map((i) => ({
                                    name: i.product_name,
                                    size: i.size ?? undefined,
                                    qty: i.quantity,
                                    unitPrice: i.unit_price,
                                  })),
                                });
                              }}
                            >
                              <FileText size={13} /> Bon de commande PDF
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {shown.length === 0 && (
            <div className="card p-10 text-center">
              <p className="font-display font-bold">Aucune commande dans ce statut</p>
              <p className="mt-1 text-sm text-ink/55">
                Elles apparaîtront ici dès qu&apos;un client commandera.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
