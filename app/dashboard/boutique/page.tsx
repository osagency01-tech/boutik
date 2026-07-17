"use client";

import { Reveal } from "@/components/motion";
import { SaveIndicator } from "@/components/states";
import { SHOP_ICONS, ShopLogo } from "@/components/icons";
import PalettePicker from "@/components/palette-picker";
import TemplateSketch from "@/components/template-sketch";
import { fcfa } from "@/lib/data";
import {
  TEMPLATE_INFO,
  TIER_ACCESS,
  canUseTemplate,
  fileToDataUrl,
  useStore,
  type Plan,
  type TemplateId,
  type Tier,
  type Zone,
} from "@/lib/store";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Lightbulb,
  Lock,
  MapPin,
  Palette,
  Phone,
  Plus,
  RotateCcw,
  Trash2,
  Type,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

type Tab = "identite" | "design" | "accueil" | "contact" | "livraison";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "identite", label: "Identité", icon: Type },
  { id: "design", label: "Design", icon: Palette },
  { id: "accueil", label: "Accueil", icon: ImageIcon },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "livraison", label: "Livraison", icon: MapPin },
];

export default function ShopEditor() {
  const { resetDemo, saveState, demoMode } = useStore();
  const [tab, setTab] = useState<Tab>("identite");
  const [saved, setSaved] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  /* En mode démo, rien ne part au serveur : on simule le retour visuel.
     Avec Supabase, saveState reflète l'écriture réelle. */
  const touch = () => {
    if (!demoMode) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 1400);
  };

  return (
    <div>
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Ma boutique</h1>
            <p className="mt-1 text-sm text-ink/55">
              Personnalise tout ici. Les changements sont enregistrés automatiquement.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {demoMode ? (
              <AnimatePresence>
                {saved && (
                  <motion.span
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="chip bg-primary-soft text-primary-dark"
                  >
                    <Check size={13} /> Enregistré
                  </motion.span>
                )}
              </AnimatePresence>
            ) : (
              <SaveIndicator state={saveState} />
            )}
            <Link href="/boutique" className="btn-primary btn-md">
              Voir ma boutique <ExternalLink size={14} />
            </Link>
          </div>
        </div>
      </Reveal>

      <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr),340px] lg:items-start">
        {/* ---------- Colonne édition ---------- */}
        <div className="min-w-0">
          <div className="nice-scroll flex gap-2 overflow-x-auto pb-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`chip shrink-0 gap-1.5 border transition-all ${
                  tab === t.id
                    ? "border-ink bg-ink text-white"
                    : "border-ink/15 bg-white text-ink/70 hover:border-ink/40"
                }`}
              >
                <t.icon size={13} /> {t.label}
              </button>
            ))}
          </div>

          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="card mt-4 space-y-5 p-6"
          >
            {tab === "identite" && <IdentiteTab touch={touch} />}
            {tab === "design" && <DesignTab touch={touch} />}
            {tab === "accueil" && <AccueilTab touch={touch} />}
            {tab === "contact" && <ContactTab touch={touch} />}
            {tab === "livraison" && <LivraisonTab touch={touch} />}
          </motion.div>

          <button
            onClick={() => {
              if (confirm("Remettre la boutique de démonstration ? Tes modifications seront perdues.")) {
                resetDemo();
                touch();
              }
            }}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-ink/45 hover:text-terra"
          >
            <RotateCcw size={12} /> Réinitialiser la boutique de démo
          </button>
        </div>

        {/* ---------- Aperçu direct (desktop) ---------- */}
        <div className="sticky top-6 hidden lg:block">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink/45">
            <Eye size={13} /> Aperçu en direct
          </p>
          <LivePreview />
        </div>
      </div>

      {/* ---------- Aperçu mobile ---------- */}
      <button
        onClick={() => setPreviewOpen(true)}
        className="btn-ink fixed bottom-20 right-4 z-40 gap-2 px-5 py-3 text-sm shadow-lift lg:hidden"
      >
        <Eye size={16} /> Aperçu
      </button>

      <AnimatePresence>
        {previewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-ink/60 backdrop-blur-sm lg:hidden"
            onClick={() => setPreviewOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="mt-auto rounded-t-3xl bg-cream p-4 pb-6"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink/45">
                  <Eye size={13} /> Aperçu en direct
                </p>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="rounded-full p-1.5 text-ink/40 hover:bg-white"
                  aria-label="Fermer l'aperçu"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="mx-auto max-w-[280px]">
                <LivePreview />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================= Aperçu ================= */

function LivePreview() {
  const { config, products, palette } = useStore();
  const featured = products.filter((p) => p.featured).slice(0, 4);
  const shown = (featured.length ? featured : products).slice(0, 4);

  return (
    <div className="overflow-hidden rounded-[1.6rem] border-[8px] border-ink bg-white shadow-lift">
      {/* barre */}
      <div className="flex items-center gap-2 bg-cream px-3 py-2">
        <ShopLogo
          logo={config.logo}
          icon={config.logoIcon}
          name={config.name}
          accent={palette.accent}
          size={24}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[11px] font-extrabold leading-tight">{config.name || "Ma boutique"}</p>
          <p className="truncate text-[8px] leading-tight text-ink/45">{config.tagline}</p>
        </div>
      </div>

      <div className={`nice-scroll h-[420px] overflow-y-auto p-2.5 ${
        config.template === "luxury" ? "bg-ink" : ""
      }`}>
        {config.template === "classique" && (
          <>
            <div
              className="wax-pattern-dense relative overflow-hidden rounded-xl p-3 text-white"
              style={{ background: `linear-gradient(135deg, ${palette.accent}, ${palette.accent}B3)` }}
            >
              <p className="text-[7px] font-bold uppercase tracking-[0.15em] opacity-80">{config.bannerBadge}</p>
              <p className="mt-1 font-display text-[13px] font-extrabold leading-tight">{config.bannerTitle}</p>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {shown.map((p) => <MiniCard key={p.id} p={p} accent={palette.accent} />)}
            </div>
          </>
        )}

        {config.template === "catalogue" && (
          <>
            <div className="rounded-xl bg-cream p-2.5">
              <p className="text-[7px] font-bold uppercase tracking-[0.15em]" style={{ color: palette.accent }}>
                {config.bannerBadge}
              </p>
              <p className="mt-0.5 font-display text-[12px] font-extrabold">{config.bannerTitle}</p>
            </div>
            <div className="mt-2.5 grid grid-cols-3 gap-1.5">
              {products.slice(0, 9).map((p) => <MiniCard key={p.id} p={p} accent={palette.accent} tiny />)}
            </div>
          </>
        )}

        {config.template === "vitrine" && (
          <>
            <p className="mt-1 text-center text-[7px] font-bold uppercase tracking-[0.25em]" style={{ color: palette.accent }}>
              {config.bannerBadge}
            </p>
            <p className="mt-1.5 text-center font-display text-[15px] font-extrabold leading-tight">
              {config.bannerTitle}
            </p>
            {shown[0] && <div className="mt-2.5"><MiniVisual p={shown[0]} className="h-28 rounded-xl" /></div>}
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {shown.slice(1).map((p) => <MiniCard key={p.id} p={p} accent={palette.accent} />)}
            </div>
          </>
        )}

        {config.template === "fashion" && (
          <>
            {shown[0] && (
              <div className="relative overflow-hidden rounded-xl">
                <MiniVisual p={shown[0]} className="h-32" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-2 text-white">
                  <p className="text-[6px] font-bold uppercase tracking-[0.3em] opacity-80">{config.bannerBadge}</p>
                  <p className="font-display text-[12px] font-extrabold uppercase leading-none">{config.bannerTitle}</p>
                </div>
              </div>
            )}
            <div className="mt-2 border-b-2 border-ink pb-1">
              <p className="font-display text-[9px] font-extrabold uppercase">Le défilé</p>
            </div>
            <div className="nice-scroll mt-2 flex gap-1.5 overflow-x-auto">
              {products.slice(1, 6).map((p) => (
                <div key={p.id} className="w-16 shrink-0">
                  <MiniVisual p={p} className="h-20 rounded-lg" />
                  <p className="mt-1 truncate text-[6px] font-bold uppercase">{p.name}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {config.template === "beauty" && (
          <>
            <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: palette.accent + "20" }}>
              <p className="text-[6px] font-bold uppercase tracking-widest" style={{ color: palette.accent }}>
                {config.bannerBadge}
              </p>
              <p className="mt-1 font-display text-[12px] font-extrabold leading-tight">{config.bannerTitle}</p>
            </div>
            <div className="mt-2.5 space-y-2">
              {shown.slice(0, 3).map((p, i) => (
                <div key={p.id} className={`flex items-center gap-2 ${i % 2 ? "flex-row-reverse" : ""}`}>
                  <MiniVisual p={p} className="h-12 w-12 shrink-0 rounded-2xl" />
                  <div className={`min-w-0 flex-1 ${i % 2 ? "text-right" : ""}`}>
                    <p className="truncate text-[7px] font-bold">{p.name}</p>
                    <p className="text-[7px] font-extrabold" style={{ color: palette.accent }}>{fcfa(p.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {config.template === "food" && (
          <>
            <div className="rounded-xl p-2.5 text-center text-white" style={{ background: `linear-gradient(135deg, ${palette.accent}, ${palette.accent}C0)` }}>
              <p className="text-[6px] font-bold uppercase tracking-widest opacity-85">{config.bannerBadge}</p>
              <p className="mt-0.5 font-display text-[11px] font-extrabold leading-tight">{config.bannerTitle}</p>
            </div>
            <div className="mt-2 space-y-1.5">
              {products.slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center gap-1.5 rounded-lg bg-white p-1.5 shadow-card">
                  <MiniVisual p={p} className="h-7 w-7 shrink-0 rounded" />
                  <p className="min-w-0 flex-1 truncate text-[7px] font-bold">{p.name}</p>
                  <p className="text-[7px] font-extrabold" style={{ color: palette.accent }}>{fcfa(p.price)}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {config.template === "luxury" && (
          <div className="py-3 text-white">
            <p className="text-center text-[5px] font-bold uppercase tracking-[0.5em] text-white/45">
              {config.bannerBadge}
            </p>
            <p className="mx-auto mt-2 max-w-[80%] text-center font-display text-[10px] font-light uppercase leading-relaxed tracking-[0.15em]">
              {config.bannerTitle}
            </p>
            <div className="mx-auto mt-2 h-px w-6" style={{ backgroundColor: palette.accent }} />
            {shown[0] && <div className="mt-3"><MiniVisual p={shown[0]} className="h-28" /></div>}
            <div className="mt-3 grid grid-cols-2 gap-3">
              {shown.slice(1, 3).map((p) => (
                <div key={p.id}>
                  <MiniVisual p={p} className="h-16" />
                  <p className="mt-1 text-center text-[6px] font-light uppercase tracking-[0.2em]">{p.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {config.template === "modern" && (
          <>
            <div className="grid grid-cols-3 grid-rows-2 gap-1.5">
              <div
                className="col-span-2 row-span-2 rounded-xl p-2 text-white"
                style={{ background: `linear-gradient(135deg, ${palette.accent}, ${palette.accent}AA)` }}
              >
                <p className="text-[5px] font-black uppercase tracking-widest opacity-80">{config.bannerBadge}</p>
                <p className="mt-1 font-display text-[11px] font-extrabold leading-none">{config.bannerTitle}</p>
              </div>
              {shown[0] && <MiniVisual p={shown[0]} className="h-full min-h-[28px] rounded-xl" />}
              <div className="rounded-xl bg-ink p-1.5">
                <p className="font-display text-[9px] font-black text-white">{products.length}</p>
                <p className="text-[5px] font-bold uppercase text-white/50">produits</p>
              </div>
            </div>
            <div className="mt-1.5 grid grid-cols-4 gap-1">
              {products.slice(1, 9).map((p, i) => (
                <div key={p.id} className={i % 5 === 0 ? "col-span-2" : ""}>
                  <MiniVisual p={p} className="h-10 rounded-lg" />
                </div>
              ))}
            </div>
          </>
        )}

        {config.template === "artisan" && (
          <>
            <div className="text-center">
              <div className="mx-auto w-fit">
                <ShopLogo
                  logo={config.logo}
                  icon={config.logoIcon}
                  name={config.name}
                  accent={palette.accent}
                  size={28}
                />
              </div>
              <p className="mt-1.5 text-[5px] font-bold uppercase tracking-[0.3em]" style={{ color: palette.accent }}>
                {config.bannerBadge}
              </p>
              <p className="mt-1 font-display text-[11px] font-extrabold leading-tight">{config.bannerTitle}</p>
            </div>
            <div className="mt-3 space-y-2.5">
              {shown.slice(0, 3).map((p, i) => (
                <div key={p.id} className={`flex items-center gap-2 ${i % 2 ? "flex-row-reverse" : ""}`}>
                  <div className="relative shrink-0">
                    <MiniVisual p={p} className="h-14 w-14 rounded-lg" />
                    <span
                      className="absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[5px] font-extrabold text-white"
                      style={{ backgroundColor: palette.accent }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className={`min-w-0 flex-1 ${i % 2 ? "text-right" : ""}`}>
                    <p className="truncate text-[7px] font-bold">{p.name}</p>
                    <p className="text-[7px] font-extrabold" style={{ color: palette.accent }}>{fcfa(p.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MiniVisual({ p, className }: { p: any; className: string }) {
  return p.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={p.image} alt="" className={`w-full object-cover ${className}`} />
  ) : (
    <div className={`relative flex items-center justify-center bg-gradient-to-br ${p.gradient} ${className}`}>
      <div className="wax-pattern-dense absolute inset-0" />
      <span className="text-xl">{p.emoji}</span>
    </div>
  );
}

function MiniCard({ p, accent, tiny }: { p: any; accent: string; tiny?: boolean }) {
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-card">
      <MiniVisual p={p} className={tiny ? "h-10" : "h-14"} />
      <div className="p-1.5">
        <p className={`truncate font-semibold ${tiny ? "text-[6px]" : "text-[8px]"}`}>{p.name}</p>
        <p className={`font-extrabold ${tiny ? "text-[6px]" : "text-[8px]"}`} style={{ color: accent }}>
          {fcfa(p.price)}
        </p>
      </div>
    </div>
  );
}

/* ================= Onglets ================= */

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-ink/45">{hint}</p>}
    </div>
  );
}

function IdentiteTab({ touch }: { touch: () => void }) {
  const { config, setConfig, palette } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pickLogo = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try {
      const url = await fileToDataUrl(f, 400);
      setConfig({ logo: url });
      touch();
    } catch {
      alert("Ce fichier n'a pas pu être chargé. Essaie une image JPG ou PNG.");
    }
    setBusy(false);
  };

  return (
    <>
      <Field label="Nom de la boutique" hint="Il apparaît en haut de chaque page.">
        <input
          className="input"
          value={config.name}
          maxLength={40}
          placeholder="Ex. Kadi Store"
          onChange={(e) => {
            setConfig({ name: e.target.value });
            touch();
          }}
        />
      </Field>

      <Field label="Slogan" hint="Une ligne courte qui dit ce que tu vends et où.">
        <input
          className="input"
          value={config.tagline}
          maxLength={60}
          placeholder="Ex. Mode & accessoires — Dakar"
          onChange={(e) => {
            setConfig({ tagline: e.target.value });
            touch();
          }}
        />
      </Field>

      <Field label="Logo" hint="Importe ton logo. Format carré conseillé, JPG ou PNG.">
        <div className="flex items-center gap-4">
          <ShopLogo
            logo={config.logo}
            icon={config.logoIcon}
            name={config.name}
            accent={palette.accent}
            size={72}
          />
          <div className="flex-1 space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickLogo(e.target.files?.[0])}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="btn-ghost btn-sm w-full"
            >
              <Upload size={14} /> {busy ? "Chargement…" : config.logo ? "Changer le logo" : "Importer mon logo"}
            </button>
            {config.logo && (
              <button
                onClick={() => {
                  setConfig({ logo: undefined });
                  touch();
                }}
                className="text-xs font-semibold text-ink/45 hover:text-terra"
              >
                Retirer le logo
              </button>
            )}
          </div>
        </div>
      </Field>

      {!config.logo && (
        <Field label="Ou choisis une icône" hint="Utilisée tant que tu n'as pas importé de logo.">
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
            {SHOP_ICONS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setConfig({ logoIcon: id });
                  touch();
                }}
                title={label}
                aria-label={label}
                className={`flex h-11 items-center justify-center rounded-xl border transition-all ${
                  config.logoIcon === id
                    ? "scale-105 border-ink bg-cream"
                    : "border-ink/10 bg-white hover:border-ink/40"
                }`}
              >
                <Icon
                  size={18}
                  strokeWidth={2}
                  style={{ color: config.logoIcon === id ? palette.accent : undefined }}
                />
              </button>
            ))}
          </div>
        </Field>
      )}

      <Field label="Notre histoire" hint="Affiché sur la page « À propos ». Raconte ton parcours, ça rassure.">
        <textarea
          className="input min-h-[110px] resize-none"
          value={config.about}
          maxLength={600}
          onChange={(e) => {
            setConfig({ about: e.target.value });
            touch();
          }}
        />
      </Field>
    </>
  );
}

function DesignTab({ touch }: { touch: () => void }) {
  const { config, setConfig, palette } = useStore();
  return (
    <>
      <Field
        label="Mon offre"
        hint="Démo : change d'offre pour voir les modèles se débloquer. En production, ceci suit l'abonnement payé."
      >
        <div className="flex flex-wrap gap-2">
          {(["Gratuit", "Starter", "Business", "Premium"] as Plan[]).map((pl) => (
            <button
              key={pl}
              onClick={() => {
                setConfig({ plan: pl });
                touch();
              }}
              className={`chip border transition-all ${
                config.plan === pl
                  ? "border-ink bg-ink text-white"
                  : "border-ink/15 bg-white text-ink/70 hover:border-ink/40"
              }`}
            >
              {pl}
            </button>
          ))}
        </div>
      </Field>

      <Field
        label="Palette de couleurs"
        hint="Un clic habille toute la boutique : bannière, boutons, prix, fonds. Les couleurs sont accordées entre elles."
      >
        <PalettePicker
          value={config.palette}
          onChange={(id) => {
            setConfig({ palette: id });
            touch();
          }}
        />
      </Field>

      <Field
        label="Modèle de boutique"
        hint="Change l'organisation de ta page d'accueil. Tes produits sont conservés."
      >
        <div className="space-y-5">
          {(["Starter", "Business", "Premium"] as Tier[]).map((tier) => {
            const unlocked = TIER_ACCESS[config.plan].includes(tier);
            return (
              <div key={tier}>
                <div className="mb-2 flex items-center gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-ink/45">
                    {tier}
                  </p>
                  {!unlocked && (
                    <span className="chip bg-ink/5 px-2 py-0 text-[9px] text-ink/50">
                      <Lock size={9} /> Offre {tier}
                    </span>
                  )}
                  <span className="h-px flex-1 bg-ink/8" />
                </div>
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {TEMPLATE_INFO.filter((t) => t.tier === tier).map((t) => {
                    const can = canUseTemplate(config.plan, t.id);
                    const active = config.template === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          if (!can) {
                            alert(
                              `Le modèle « ${t.name} » fait partie de l'offre ${t.tier}. Passe à cette offre pour l'utiliser.`
                            );
                            return;
                          }
                          setConfig({ template: t.id as TemplateId });
                          touch();
                        }}
                        className={`relative rounded-xl border p-2.5 text-left transition-all ${
                          active ? "bg-cream" : "border-ink/10 bg-white hover:border-ink/30"
                        } ${!can ? "opacity-55" : ""}`}
                        style={active ? { borderColor: palette.accent } : undefined}
                      >
                        <TemplateSketch
                          id={t.id}
                          accent={palette.accent}
                          logo={config.logo}
                          logoIcon={config.logoIcon}
                        />
                        <p className="mt-2 flex items-center gap-1 font-display text-xs font-bold">
                          {t.name}
                          {active && <Check size={12} style={{ color: palette.accent }} strokeWidth={3} />}
                          {!can && <Lock size={10} className="text-ink/35" />}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-ink/50">
                          {t.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Field>
    </>
  );
}

function AccueilTab({ touch }: { touch: () => void }) {
  const { config, setConfig } = useStore();

  const setPerk = (i: number, v: string) => {
    const perks = config.perks.map((p, idx) => (idx === i ? v : p));
    setConfig({ perks });
    touch();
  };
  const addPerk = () => {
    setConfig({ perks: [...config.perks, "Nouvel argument"] });
    touch();
  };
  const removePerk = (i: number) => {
    setConfig({ perks: config.perks.filter((_, idx) => idx !== i) });
    touch();
  };

  return (
    <>
      <Field label="Petit texte au-dessus du titre" hint="Ex. « Nouvelle collection », « Promo du mois ».">
        <input
          className="input"
          value={config.bannerBadge}
          maxLength={30}
          onChange={(e) => {
            setConfig({ bannerBadge: e.target.value });
            touch();
          }}
        />
      </Field>

      <Field label="Titre de la bannière" hint="La première phrase que voit ton client. Sois direct.">
        <input
          className="input"
          value={config.bannerTitle}
          maxLength={70}
          onChange={(e) => {
            setConfig({ bannerTitle: e.target.value });
            touch();
          }}
        />
      </Field>

      <Field label="Texte de la bannière">
        <textarea
          className="input min-h-[80px] resize-none"
          value={config.bannerSubtitle}
          maxLength={200}
          onChange={(e) => {
            setConfig({ bannerSubtitle: e.target.value });
            touch();
          }}
        />
      </Field>

      <Field label="Texte du bouton" hint="Ex. « Découvrir la boutique », « Voir le menu ».">
        <input
          className="input"
          value={config.ctaLabel}
          maxLength={30}
          onChange={(e) => {
            setConfig({ ctaLabel: e.target.value });
            touch();
          }}
        />
      </Field>

      <Field label="Tes arguments" hint="Affichés sous la bannière. Ce qui rassure : délai, qualité, réactivité.">
        <div className="space-y-2">
          {config.perks.map((perk, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className="input flex-1 py-2 text-sm"
                value={perk}
                maxLength={40}
                onChange={(e) => setPerk(i, e.target.value)}
              />
              <button
                onClick={() => removePerk(i)}
                className="shrink-0 rounded-lg p-2 text-ink/35 hover:text-terra"
                aria-label="Supprimer cet argument"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {config.perks.length < 4 && (
            <button onClick={addPerk} className="btn-ghost btn-sm w-full">
              <Plus size={14} /> Ajouter un argument
            </button>
          )}
        </div>
      </Field>

      <Field label="Titre de la section produits">
        <div className="grid grid-cols-2 gap-2">
          <input
            className="input py-2 text-sm"
            value={config.featuredEyebrow}
            maxLength={20}
            placeholder="Sélection"
            onChange={(e) => {
              setConfig({ featuredEyebrow: e.target.value });
              touch();
            }}
          />
          <input
            className="input py-2 text-sm"
            value={config.featuredTitle}
            maxLength={40}
            placeholder="Nos coups de cœur"
            onChange={(e) => {
              setConfig({ featuredTitle: e.target.value });
              touch();
            }}
          />
        </div>
      </Field>

      <div className="flex gap-2.5 rounded-xl bg-cream p-4 text-xs leading-relaxed shop-muted">
        <Lightbulb size={15} className="mt-px shrink-0 text-ink/40" />
        <span>
          Pour choisir les produits affichés en avant sur l&apos;accueil, va dans{" "}
          <Link href="/dashboard/produits" className="font-bold underline">
            Produits
          </Link>{" "}
          et active « Mettre en avant ».
        </span>
      </div>
    </>
  );
}

function ContactTab({ touch }: { touch: () => void }) {
  const { config, setConfig, palette } = useStore();
  return (
    <>
      <Field
        label="Numéro WhatsApp"
        hint="Format international, sans + ni espaces. Ex. 2250700000000. C'est là qu'arrivent tes commandes."
      >
        <input
          className="input"
          value={config.whatsapp}
          inputMode="numeric"
          onChange={(e) => {
            setConfig({ whatsapp: e.target.value.replace(/\D/g, "") });
            touch();
          }}
        />
      </Field>
      <Field label="Téléphone affiché">
        <input
          className="input"
          value={config.phone}
          onChange={(e) => {
            setConfig({ phone: e.target.value });
            touch();
          }}
        />
      </Field>
      <Field label="Instagram">
        <input
          className="input"
          value={config.instagram}
          placeholder="@ma.boutique"
          onChange={(e) => {
            setConfig({ instagram: e.target.value });
            touch();
          }}
        />
      </Field>
      <Field label="Horaires">
        <input
          className="input"
          value={config.hours}
          placeholder="Lun–Sam, 8 h – 19 h"
          onChange={(e) => {
            setConfig({ hours: e.target.value });
            touch();
          }}
        />
      </Field>
    </>
  );
}

function LivraisonTab({ touch }: { touch: () => void }) {
  const { config, setConfig, palette } = useStore();

  const update = (i: number, patch: Partial<Zone>) => {
    const zones = config.zones.map((z, idx) => (idx === i ? { ...z, ...patch } : z));
    setConfig({ zones });
    touch();
  };
  const remove = (i: number) => {
    setConfig({ zones: config.zones.filter((_, idx) => idx !== i) });
    touch();
  };
  const add = () => {
    setConfig({ zones: [...config.zones, { zone: "Nouvelle zone", price: 1000, delay: "24 h" }] });
    touch();
  };

  return (
    <>
      <p className="text-sm text-ink/60">
        Ces zones apparaissent au moment de la commande. Le client choisit la sienne et les frais
        s'ajoutent au total.
      </p>
      <div className="space-y-3">
        {config.zones.map((z, i) => (
          <div key={i} className="rounded-xl border border-ink/10 p-3">
            <div className="flex items-center gap-2">
              <input
                className="input flex-1 py-2 text-sm"
                value={z.zone}
                placeholder="Nom de la zone"
                onChange={(e) => update(i, { zone: e.target.value })}
              />
              <button
                onClick={() => remove(i)}
                className="shrink-0 rounded-lg p-2 text-ink/35 hover:text-terra"
                aria-label="Supprimer la zone"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-ink/50">Frais (FCFA)</span>
                <input
                  type="number"
                  min={0}
                  className="input py-2 text-sm"
                  value={z.price}
                  onChange={(e) => update(i, { price: Math.max(0, Number(e.target.value) || 0) })}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-ink/50">Délai</span>
                <input
                  className="input py-2 text-sm"
                  value={z.delay}
                  placeholder="24 h"
                  onChange={(e) => update(i, { delay: e.target.value })}
                />
              </label>
            </div>
          </div>
        ))}
      </div>
      <button onClick={add} className="btn-ghost btn-md w-full">
        <Plus size={15} /> Ajouter une zone
      </button>

      <Field label="Conditions" hint="Affiché en bas de la page Livraison. Paiement, retours, garanties.">
        <textarea
          className="input min-h-[90px] resize-none"
          value={config.deliveryNote}
          maxLength={300}
          onChange={(e) => {
            setConfig({ deliveryNote: e.target.value });
            touch();
          }}
        />
      </Field>
    </>
  );
}
