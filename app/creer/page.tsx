"use client";

import { BoutikLogo } from "@/components/brand";
import { SHOP_ICONS, ShopLogo } from "@/components/icons";
import PalettePicker from "@/components/palette-picker";
import { AuthProvider, useAuth } from "@/lib/auth";
import { LoadingScreen } from "@/components/states";
import TemplateSketch from "@/components/template-sketch";
import {
  StoreProvider,
  TEMPLATE_INFO,
  canUseTemplate,
  fileToDataUrl,
  useStore,
} from "@/lib/store";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, Lock, PartyPopper, Store, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Page() {
  return (
    <AuthProvider>
      <StoreProvider>
        <Wizard />
      </StoreProvider>
    </AuthProvider>
  );
}

const STEPS = ["Ta boutique", "Ton style", "Ton WhatsApp"];

function Wizard() {
  const { config, setConfig, startFresh, ready, palette, demoMode, createShopFromConfig, hasShop } =
    useStore();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(-1);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /* Créer une boutique demande d'être connecté (sauf en démo) */
  useEffect(() => {
    if (!demoMode && !authLoading && !user) router.replace("/connexion");
  }, [demoMode, authLoading, user, router]);

  /* Déjà une boutique : inutile de repasser par le wizard */
  useEffect(() => {
    if (!demoMode && ready && hasShop) router.replace("/dashboard");
  }, [demoMode, ready, hasShop, router]);

  const canNext =
    step === 0
      ? config.name.trim().length > 1 && config.tagline.trim().length > 1
      : step === 2
      ? config.whatsapp.replace(/\D/g, "").length >= 8
      : true;

  const finish = async () => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    if (demoMode) {
      setConfig({ published: true });
      setDone(true);
      setBusy(false);
      return;
    }
    try {
      await createShopFromConfig();
      setDone(true);
    } catch (e: any) {
      setErr(e?.message ?? "La boutique n'a pas pu être créée. Réessaie.");
    }
    setBusy(false);
  };

  if (!ready || authLoading) return <LoadingScreen />;

  if (step === -1)
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white">
            <Store size={24} strokeWidth={2.5} />
          </span>
          <h1 className="mt-6 font-display text-3xl font-extrabold">Crée ta boutique</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink/60">
            Trois questions, et ta boutique existe. Tu ajoutes tes produits juste après.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={() => {
                startFresh();
                setStep(0);
              }}
              className="btn-primary btn-lg"
            >
              Commencer <ArrowRight size={17} />
            </button>
            <button onClick={() => setStep(0)} className="btn-ghost btn-lg">
              Partir de la boutique d&apos;exemple
            </button>
          </div>
          <p className="mt-4 text-xs text-ink/40">
            L&apos;exemple te laisse voir une boutique déjà remplie. Tu pourras tout remplacer.
          </p>
        </motion.div>
      </div>
    );

  if (done)
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <motion.span
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 200 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: palette.accent }}
          >
            <PartyPopper size={34} />
          </motion.span>
          <h1 className="mt-6 font-display text-3xl font-extrabold">{config.name} est prête !</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink/60">
            Ta boutique existe. Prochaine étape : ajoute tes produits, puis partage ton lien sur
            WhatsApp.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link href="/dashboard/produits" className="btn-primary btn-lg">
              Ajouter mes produits <ArrowRight size={17} />
            </Link>
            <Link href="/boutique" className="btn-ghost btn-lg">
              Voir ma boutique
            </Link>
          </div>
        </motion.div>
      </div>
    );

  return (
    <div className="min-h-screen bg-cream">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-4 py-5">
        <BoutikLogo className="h-7" />
        <span className="text-xs font-semibold text-ink/45">
          Étape {step + 1} sur {STEPS.length}
        </span>
      </header>

      <div className="mx-auto max-w-2xl px-4">
        {/* progression */}
        <div className="flex gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: palette.accent }}
                  initial={false}
                  animate={{ width: i <= step ? "100%" : "0%" }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <p className={`mt-1.5 text-[11px] font-semibold ${i <= step ? "text-ink" : "text-ink/35"}`}>
                {s}
              </p>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28 }}
            className="card mt-6 p-6 sm:p-8"
          >
            {step === 0 && <Step1 />}
            {step === 1 && <Step2 />}
            {step === 2 && <Step3 />}
          </motion.div>
        </AnimatePresence>

        {err && (
          <p className="mt-4 rounded-xl bg-terra-soft px-4 py-3 text-sm font-semibold text-terra">
            {err}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between pb-12">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className={`btn-ghost btn-md ${step === 0 ? "invisible" : ""}`}
          >
            <ArrowLeft size={15} /> Retour
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext}
              className="btn btn-md text-white disabled:cursor-not-allowed disabled:opacity-35"
              style={{ backgroundColor: palette.accent }}
            >
              Continuer <ArrowRight size={15} />
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={!canNext || busy}
              className="btn btn-md text-white disabled:cursor-not-allowed disabled:opacity-35"
              style={{ backgroundColor: palette.accent }}
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={16} />}
              {busy ? "Création…" : "Créer ma boutique"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Step1() {
  const { config, setConfig, palette } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pickLogo = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try {
      setConfig({ logo: await fileToDataUrl(f, 400) });
    } catch {
      alert("Ce fichier n'a pas pu être chargé. Essaie une image JPG ou PNG.");
    }
    setBusy(false);
  };

  return (
    <>
      <h1 className="font-display text-2xl font-extrabold">Comment s&apos;appelle ta boutique ?</h1>
      <p className="mt-1.5 text-sm text-ink/55">Tu pourras tout changer plus tard.</p>
      <div className="mt-6 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-bold">Nom de la boutique</label>
          <input
            className="input"
            autoFocus
            value={config.name}
            maxLength={40}
            placeholder="Ex. Kadi Store"
            onChange={(e) => setConfig({ name: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-bold">Que vends-tu, et où ?</label>
          <input
            className="input"
            value={config.tagline}
            maxLength={60}
            placeholder="Ex. Mode & accessoires — Abidjan"
            onChange={(e) => setConfig({ tagline: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-bold">Ton logo</label>
          <div className="flex items-center gap-4">
            <ShopLogo
              logo={config.logo}
              icon={config.logoIcon}
              name={config.name}
              accent={palette.accent}
              size={64}
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
                <Upload size={14} />{" "}
                {busy ? "Chargement…" : config.logo ? "Changer le logo" : "Importer mon logo"}
              </button>
              {config.logo && (
                <button
                  onClick={() => setConfig({ logo: undefined })}
                  className="text-xs font-semibold text-ink/45 hover:text-terra"
                >
                  Retirer
                </button>
              )}
            </div>
          </div>
        </div>

        {!config.logo && (
          <div>
            <label className="mb-1.5 block text-sm font-bold">
              Pas de logo ? Choisis une icône
            </label>
            <div className="grid grid-cols-8 gap-2">
              {SHOP_ICONS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setConfig({ logoIcon: id })}
                  title={label}
                  aria-label={label}
                  className={`flex h-10 items-center justify-center rounded-xl border transition-all ${
                    config.logoIcon === id
                      ? "scale-105 border-ink bg-cream"
                      : "border-ink/10 bg-white hover:border-ink/40"
                  }`}
                >
                  <Icon
                    size={16}
                    strokeWidth={2}
                    style={{ color: config.logoIcon === id ? palette.accent : undefined }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Step2() {
  const { config, setConfig, palette } = useStore();
  return (
    <>
      <h1 className="font-display text-2xl font-extrabold">Choisis ton style</h1>
      <p className="mt-1.5 text-sm text-ink/55">
        Une couleur et un modèle. Tu peux en changer quand tu veux.
      </p>
      <div className="mt-6 space-y-6">
        <div>
          <label className="mb-2 block text-sm font-bold">Palette de couleurs</label>
          <p className="mb-3 text-xs text-ink/45">
            Choisis une ambiance : les couleurs sont déjà accordées entre elles.
          </p>
          <PalettePicker
            value={config.palette}
            onChange={(id) => setConfig({ palette: id })}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-bold">Modèle de boutique</label>
          <p className="mb-3 text-xs text-ink/45">
            Les modèles Business et Premium se débloquent avec l&apos;offre correspondante.
          </p>
          <div className="space-y-4">
            {(["Starter", "Business", "Premium"] as const).map((tier) => (
              <div key={tier}>
                <div className="mb-2 flex items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink/45">
                    {tier}
                  </p>
                  <span className="h-px flex-1 bg-ink/8" />
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {TEMPLATE_INFO.filter((t) => t.tier === tier).map((t) => {
                    const can = canUseTemplate(config.plan, t.id);
                    const active = config.template === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          if (!can) {
                            alert(
                              `Le modèle « ${t.name} » fait partie de l'offre ${t.tier}. Tu pourras le choisir en passant à cette offre.`
                            );
                            return;
                          }
                          setConfig({ template: t.id });
                        }}
                        className={`rounded-xl border p-2.5 text-left transition-all ${
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
                        <p className="mt-1.5 flex items-center gap-1 font-display text-xs font-bold">
                          {t.name}
                          {active && <Check size={11} style={{ color: palette.accent }} strokeWidth={3} />}
                          {!can && <Lock size={9} className="text-ink/35" />}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Step3() {
  const { config, setConfig, palette } = useStore();
  return (
    <>
      <h1 className="font-display text-2xl font-extrabold">Où reçois-tu tes commandes ?</h1>
      <p className="mt-1.5 text-sm text-ink/55">
        Chaque commande arrivera sur ce numéro WhatsApp, avec le bon de commande.
      </p>
      <div className="mt-6 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-bold">Numéro WhatsApp</label>
          <input
            className="input"
            autoFocus
            inputMode="numeric"
            value={config.whatsapp}
            placeholder="2250700000000"
            onChange={(e) => setConfig({ whatsapp: e.target.value.replace(/\D/g, "") })}
          />
          <p className="mt-1.5 text-xs text-ink/45">
            Indicatif pays + numéro, sans + ni espaces. Ex. Côte d&apos;Ivoire : 225 07 00 00 00 00 →
            2250700000000
          </p>
        </div>
        <div className="rounded-xl bg-cream p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/45">Aperçu</p>
          <div className="mt-2 flex items-center gap-2.5">
            <ShopLogo
              logo={config.logo}
              icon={config.logoIcon}
              name={config.name}
              accent={palette.accent}
              size={40}
            />
            <div>
              <p className="font-display text-sm font-extrabold">{config.name || "Ma boutique"}</p>
              <p className="text-[11px] text-ink/50">{config.tagline || "Mon slogan"}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
