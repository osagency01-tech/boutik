"use client";

import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { ProductPlaceholder, SHOP_ICONS } from "@/components/icons";
import PhotoEditor from "@/components/photo-editor";
import { EmptyProductsGuide } from "@/components/onboarding";
import { ProductVisual } from "@/components/product-card";
import { fcfa, type Product } from "@/lib/data";
import { fileToDataUrl, useStore } from "@/lib/store";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

type Draft = {
  name: string;
  price: string;
  oldPrice: string;
  category: string;
  stock: string;
  description: string;
  sizes: string;
  colors: string;
  icon: string;
  image?: string;
  images: string[];
  featured: boolean;
};

const EMPTY: Draft = {
  name: "",
  price: "",
  oldPrice: "",
  category: "",
  stock: "1",
  description: "",
  sizes: "",
  colors: "",
  icon: "package",
  image: undefined,
  images: [],
  featured: false,
};

export default function ProductsAdmin() {
  const {
    config,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    duplicateProduct,
    moveProduct,
    quota,
    palette,
  } = useStore();
  const [editing, setEditing] = useState<Product | "new" | null>(null);

  const used = products.length;
  const full = used >= quota;
  const pct = quota === Infinity ? 8 : Math.min(100, (used / quota) * 100);

  return (
    <div>
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Mes produits</h1>
            <p className="mt-1 text-sm text-ink/55">
              {used} produit{used > 1 ? "s" : ""} en ligne
            </p>
          </div>
          <button
            onClick={() => setEditing("new")}
            disabled={full}
            className="btn-primary btn-md disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={16} /> Ajouter un produit
          </button>
        </div>
      </Reveal>

      <Reveal delay={0.08}>
        <div className="card mt-5 p-5">
          <div className="flex items-center justify-between text-sm">
            <p className="font-bold">Quota de l&apos;offre {config.plan}</p>
            <p className="font-semibold text-ink/55">
              {used} / {quota === Infinity ? "∞" : quota} produits
            </p>
          </div>
          <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-cream">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${palette.accent}, ${palette.accent}99)` }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </div>
          <p className="mt-2 text-xs text-ink/45">
            {full
              ? "Quota atteint. Passe à l'offre supérieure pour ajouter plus de produits."
              : "Besoin de plus ? L'offre Premium débloque les produits illimités."}
          </p>
        </div>
      </Reveal>

      {products.length === 0 && <EmptyProductsGuide onAdd={() => setEditing("new")} />}

      <Stagger className="mt-5 space-y-3" gap={0.04}>
        {products.map((p, i) => (
          <StaggerItem key={p.id}>
            <div className="card flex items-center gap-3 p-3 sm:gap-4">
              <ProductVisual product={p} className="h-16 w-16 shrink-0 rounded-xl" iconSize={24} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-bold">
                  {p.featured && <Star size={12} className="shrink-0 fill-mango text-mango" />}
                  {p.name}
                </p>
                <p className="text-xs text-ink/50">{p.category}</p>
                <p className="mt-0.5 text-sm font-extrabold sm:hidden" style={{ color: palette.accent }}>
                  {fcfa(p.price)}
                </p>
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-extrabold" style={{ color: palette.accent }}>
                  {fcfa(p.price)}
                </p>
                <p className={`text-xs font-semibold ${p.stock === 0 ? "text-terra" : "text-ink/50"}`}>
                  {p.stock === 0 ? "Épuisé" : `Stock : ${p.stock}`}
                </p>
              </div>
              {/* Ordre : c'est l'ordre d'affichage réel en boutique */}
              <div className="hidden flex-col gap-0.5 lg:flex">
                <button
                  onClick={() => moveProduct(p.id, -1)}
                  disabled={i === 0}
                  className="rounded p-0.5 text-ink/30 transition-colors hover:text-ink disabled:opacity-20"
                  aria-label="Monter"
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  onClick={() => moveProduct(p.id, 1)}
                  disabled={i === products.length - 1}
                  className="rounded p-0.5 text-ink/30 transition-colors hover:text-ink disabled:opacity-20"
                  aria-label="Descendre"
                >
                  <ArrowDown size={13} />
                </button>
              </div>
              <button
                onClick={() => updateProduct(p.id, { featured: !p.featured })}
                className={`hidden rounded-full border p-2.5 transition-colors sm:block ${
                  p.featured
                    ? "border-mango bg-mango-soft text-yellow-700"
                    : "border-ink/10 text-ink/35 hover:border-ink/40 hover:text-ink"
                }`}
                aria-label="Mettre en avant"
                title="Mettre en avant sur l'accueil"
              >
                <Star size={14} className={p.featured ? "fill-current" : ""} />
              </button>
              <button
                onClick={() => updateProduct(p.id, { hidden: !p.hidden })}
                className={`hidden rounded-full border p-2.5 transition-colors sm:block ${
                  p.hidden
                    ? "border-ink/30 bg-ink/5 text-ink/60"
                    : "border-ink/10 text-ink/35 hover:border-ink/40 hover:text-ink"
                }`}
                aria-label={p.hidden ? "Afficher en boutique" : "Masquer de la boutique"}
                title={p.hidden ? "Masqué — cliquer pour afficher" : "Visible — cliquer pour masquer"}
              >
                {p.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                onClick={() => {
                  if (!duplicateProduct(p.id))
                    alert(`Quota atteint : l'offre ${config.plan} permet ${quota} produits.`);
                }}
                className="hidden rounded-full border border-ink/10 p-2.5 text-ink/35 transition-colors hover:border-ink/40 hover:text-ink sm:block"
                aria-label={`Dupliquer ${p.name}`}
                title="Dupliquer"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={() => setEditing(p)}
                className="rounded-full border border-ink/10 p-2.5 text-ink/50 transition-colors hover:border-ink/40 hover:text-ink"
                aria-label={`Modifier ${p.name}`}
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Supprimer « ${p.name} » ? Cette action est définitive.`)) deleteProduct(p.id);
                }}
                className="rounded-full border border-ink/10 p-2.5 text-ink/35 transition-colors hover:border-terra hover:text-terra"
                aria-label={`Supprimer ${p.name}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <AnimatePresence>
        {editing && (
          <ProductModal
            product={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
            onSave={(draft) => {
              const payload = {
                name: draft.name.trim(),
                price: Number(draft.price) || 0,
                oldPrice: draft.oldPrice ? Number(draft.oldPrice) : undefined,
                category: draft.category.trim() || "Divers",
                stock: Number(draft.stock) || 0,
                description: draft.description.trim(),
                sizes: draft.sizes ? draft.sizes.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
                colors: draft.colors ? draft.colors.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
                icon: draft.icon,
                image: draft.image,
                images: draft.images,
                featured: draft.featured,
              };
              if (editing === "new") {
                const ok = addProduct(payload);
                if (!ok) {
                  alert(
                    `Quota atteint : l'offre ${config.plan} permet ${quota} produits. Passe à l'offre supérieure pour en ajouter plus.`
                  );
                  return;
                }
              } else updateProduct(editing.id, payload);
              setEditing(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductModal({
  product,
  onClose,
  onSave,
}: {
  product: Product | null;
  onClose: () => void;
  onSave: (d: Draft) => void;
}) {
  const { products, config, palette, photoQuota } = useStore();
  const [d, setD] = useState<Draft>(
    product
      ? {
          name: product.name,
          price: String(product.price),
          oldPrice: product.oldPrice ? String(product.oldPrice) : "",
          category: product.category,
          stock: String(product.stock),
          description: product.description,
          sizes: product.sizes?.join(", ") ?? "",
          colors: product.colors?.join(", ") ?? "",
          icon: product.icon,
          image: product.image,
          images: product.images ?? [],
          featured: !!product.featured,
        }
      : EMPTY
  );
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const cats = Array.from(new Set(products.map((p) => p.category)));
  const valid = d.name.trim().length > 1 && Number(d.price) > 0;

  /* Photo principale + secondaires, vues comme une seule liste :
     la première est celle qui s'affiche en catalogue. */
  const allPhotos = [d.image, ...d.images].filter(Boolean) as string[];

  const addPhoto = (url: string) => {
    setD((x) => {
      const all = [x.image, ...x.images].filter(Boolean) as string[];
      if (all.length >= photoQuota) return x;
      return all.length === 0
        ? { ...x, image: url }
        : { ...x, images: [...x.images, url] };
    });
  };

  const removePhoto = (i: number) => {
    setD((x) => {
      const all = [x.image, ...x.images].filter(Boolean) as string[];
      all.splice(i, 1);
      return { ...x, image: all[0], images: all.slice(1) };
    });
  };

  /* On n'enregistre pas la photo brute : elle passe d'abord par
     l'éditeur. Une photo penchée ou sombre tue une fiche produit. */
  const pickImage = (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      alert("Ce fichier n'est pas une image.");
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      alert("Image trop lourde (8 Mo maximum).");
      return;
    }
    setEditing(f);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="nice-scroll max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold">
            {product ? "Modifier le produit" : "Nouveau produit"}
          </h2>
          <button onClick={onClose} className="rounded-full p-2 text-ink/40 hover:bg-cream" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-bold">Photos du produit</label>
              <span className="text-[11px] font-semibold text-ink/40">
                {allPhotos.length} / {photoQuota}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {allPhotos.map((src, i) => (
                <div key={i} className="group relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    className="h-20 w-20 rounded-xl object-cover"
                  />
                  {i === 0 && (
                    <span className="absolute left-1 top-1 rounded bg-ink/70 px-1.5 py-0.5 text-[8px] font-bold text-white">
                      Principale
                    </span>
                  )}
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Retirer cette photo"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}

              {allPhotos.length < photoQuota && (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={busy}
                  className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ink/15 text-ink/40 transition-colors hover:border-ink/40 hover:text-ink"
                >
                  <Upload size={16} />
                  <span className="text-[9px] font-bold">Ajouter</span>
                </button>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickImage(e.target.files?.[0])}
            />

            {allPhotos.length >= photoQuota ? (
              <p className="mt-2 text-[11px] leading-snug text-ink/45">
                {photoQuota === 1
                  ? "L'offre " + config.plan + " permet 1 photo par produit. Business en autorise 3, Premium 5."
                  : `Limite de l'offre ${config.plan} atteinte (${photoQuota} photos).`}
              </p>
            ) : (
              <p className="mt-2 text-[11px] leading-snug text-ink/45">
                Une vraie photo vend beaucoup mieux qu'une icône. Elle est
                automatiquement redimensionnée et compressée.
              </p>
            )}
          </div>

          {allPhotos.length === 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-bold">
                Icône provisoire
              </label>
              <div className="grid grid-cols-8 gap-1.5">
                {SHOP_ICONS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setD({ ...d, icon: id })}
                    title={label}
                    aria-label={label}
                    className={`flex h-9 items-center justify-center rounded-lg border transition-all ${
                      d.icon === id ? "border-ink bg-cream" : "border-ink/10 hover:border-ink/40"
                    }`}
                  >
                    <Icon
                      size={15}
                      strokeWidth={2}
                      style={{ color: d.icon === id ? palette.accent : undefined }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-bold">Nom du produit *</label>
            <input
              className="input"
              value={d.name}
              placeholder="Ex. Robe wax « Ama »"
              onChange={(e) => setD({ ...d, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-bold">Prix (FCFA) *</label>
              <input
                type="number"
                min={0}
                className="input"
                value={d.price}
                placeholder="15000"
                onChange={(e) => setD({ ...d, price: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold">Prix barré</label>
              <input
                type="number"
                min={0}
                className="input"
                value={d.oldPrice}
                placeholder="Facultatif"
                onChange={(e) => setD({ ...d, oldPrice: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-bold">Catégorie</label>
              <input
                className="input"
                list="cats"
                value={d.category}
                placeholder="Ex. Mode femme"
                onChange={(e) => setD({ ...d, category: e.target.value })}
              />
              <datalist id="cats">
                {cats.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold">Stock</label>
              <input
                type="number"
                min={0}
                className="input"
                value={d.stock}
                onChange={(e) => setD({ ...d, stock: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold">Description</label>
            <textarea
              className="input min-h-[90px] resize-none"
              value={d.description}
              placeholder="Matière, taille, finitions, conseils d'entretien…"
              onChange={(e) => setD({ ...d, description: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold">Tailles</label>
            <input
              className="input"
              value={d.sizes}
              placeholder="S, M, L, XL — sépare par des virgules"
              onChange={(e) => setD({ ...d, sizes: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold">Couleurs</label>
            <input
              className="input"
              value={d.colors}
              placeholder="Noir, Blanc, Rouge — sépare par des virgules"
              onChange={(e) => setD({ ...d, colors: e.target.value })}
            />
            {/* Une photo par couleur multiplierait l'egress par autant.
                Le client choisit sa couleur à la commande, elle part
                dans le message WhatsApp. */}
            <p className="mt-1.5 text-xs text-ink/45">
              Le client choisit sa couleur à la commande. Laisse vide s&apos;il n&apos;y a pas
              de choix.
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-ink/10 p-3">
            <input
              type="checkbox"
              checked={d.featured}
              onChange={(e) => setD({ ...d, featured: e.target.checked })}
              className="h-4 w-4 accent-mango"
            />
            <span className="flex-1 text-sm">
              <span className="block font-bold">Mettre en avant sur l&apos;accueil</span>
              <span className="block text-xs text-ink/50">
                Le produit apparaîtra dans la sélection de la page d&apos;accueil.
              </span>
            </span>
            <Star size={16} className={d.featured ? "fill-mango text-mango" : "text-ink/25"} />
          </label>
        </div>

        <AnimatePresence>
          {editing && (
            <PhotoEditor
              file={editing}
              onCancel={() => setEditing(null)}
              onDone={(url) => {
                addPhoto(url);
                setEditing(null);
              }}
            />
          )}
        </AnimatePresence>

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="btn-ghost btn-md flex-1">
            Annuler
          </button>
          <button
            onClick={() => onSave(d)}
            disabled={!valid}
            className="btn-primary btn-md flex-1 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Check size={16} /> {product ? "Enregistrer" : "Ajouter le produit"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
