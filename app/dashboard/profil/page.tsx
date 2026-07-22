"use client";

import { Reveal } from "@/components/motion";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import {
  AlertTriangle,
  Check,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ *
 * Mon profil
 *
 * Le compte du vendeur (email, nom, téléphone personnel), distinct de
 * sa boutique qui se gère dans l'onglet « Ma boutique ».
 * ------------------------------------------------------------------ */

export default function ProfilPage() {
  const { user, signOut, demoMode } = useAuth();
  const { palette } = useStore();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [pwdSent, setPwdSent] = useState(false);
  const [pwdBusy, setPwdBusy] = useState(false);

  /* Charge le profil du vendeur. */
  useEffect(() => {
    if (demoMode || !user) {
      setLoading(false);
      return;
    }
    const sb = supabase();
    if (!sb) return;
    sb.from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setFullName(data.full_name ?? "");
          setPhone(data.phone ?? "");
        }
        setLoading(false);
      });
  }, [user, demoMode]);

  const save = async () => {
    if (demoMode || !user) return;
    const sb = supabase();
    if (!sb) return;

    setSaveState("saving");
    const { error } = await sb
      .from("profiles")
      .update({ full_name: fullName.trim() || null, phone: phone.trim() || null })
      .eq("id", user.id);

    if (error) {
      setSaveState("error");
      return;
    }
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 1800);
  };

  /* Changement de mot de passe : on réutilise le flux d'email existant,
     déjà éprouvé, plutôt que de redemander l'ancien mot de passe ici. */
  const sendPasswordReset = async () => {
    if (demoMode || !user?.email || pwdBusy) return;
    const sb = supabase();
    if (!sb) return;

    setPwdBusy(true);
    await sb.auth.resetPasswordForEmail(user.email, {
      redirectTo:
        typeof window !== "undefined"
          ? `${window.location.origin}/connexion/nouveau-mot-de-passe`
          : undefined,
    });
    setPwdBusy(false);
    setPwdSent(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="animate-spin text-ink/30" />
      </div>
    );
  }

  return (
    <div>
      <Reveal>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Mon profil</h1>
        <p className="mt-1 text-sm text-ink/55">
          Les informations de ton compte. Ta boutique se gère dans l&apos;onglet « Ma boutique ».
        </p>
      </Reveal>

      {/* --- Email de connexion --- */}
      <Reveal delay={0.06}>
        <div className="card mt-5 flex items-center gap-4 p-5">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: palette.accent + "1A", color: palette.accent }}
          >
            <Mail size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/45">
              Email de connexion
            </p>
            <p className="mt-0.5 truncate text-sm font-bold">{user?.email ?? "—"}</p>
          </div>
        </div>
      </Reveal>

      {/* --- Informations personnelles --- */}
      <Reveal delay={0.1}>
        <h2 className="mt-8 font-display text-lg font-extrabold">Mes informations</h2>
        <div className="card mt-3 space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-sm font-bold">Nom complet</label>
            <input
              className="input"
              value={fullName}
              placeholder="Ton nom et prénom"
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold">Téléphone personnel</label>
            <input
              className="input"
              type="tel"
              inputMode="tel"
              value={phone}
              placeholder="01 97 11 29 09"
              onChange={(e) => setPhone(e.target.value)}
            />
            <p className="mt-1 text-xs text-ink/45">
              Différent du numéro WhatsApp de ta boutique, qui se règle dans « Ma boutique ».
            </p>
          </div>

          <button
            onClick={save}
            disabled={saveState === "saving"}
            className="btn-primary btn-md w-full disabled:opacity-40"
          >
            {saveState === "saving" && <Loader2 size={16} className="animate-spin" />}
            {saveState === "saved" && <Check size={16} />}
            {saveState === "saving"
              ? "Enregistrement…"
              : saveState === "saved"
                ? "Enregistré"
                : "Enregistrer"}
          </button>

          {saveState === "error" && (
            <p className="text-xs font-semibold text-terra">
              L&apos;enregistrement a échoué. Vérifie ta connexion et réessaie.
            </p>
          )}
        </div>
      </Reveal>

      {/* --- Sécurité --- */}
      <Reveal delay={0.14}>
        <h2 className="mt-8 font-display text-lg font-extrabold">Sécurité</h2>
        <div className="card mt-3 flex flex-wrap items-center gap-4 p-5">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: palette.accent + "1A", color: palette.accent }}
          >
            <KeyRound size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Mot de passe</p>
            <p className="text-xs text-ink/50">
              {pwdSent
                ? "Un lien vient de t'être envoyé par email."
                : "On t'envoie un lien par email pour en choisir un nouveau."}
            </p>
          </div>
          <button
            onClick={sendPasswordReset}
            disabled={pwdBusy || pwdSent}
            className="btn-ghost btn-sm disabled:opacity-40"
          >
            {pwdBusy && <Loader2 size={14} className="animate-spin" />}
            {pwdSent ? "Lien envoyé" : "Changer"}
          </button>
        </div>
      </Reveal>

      {/* --- Déconnexion --- */}
      {!demoMode && (
        <Reveal delay={0.18}>
          <button
            onClick={async () => {
              await signOut();
              router.replace("/connexion");
            }}
            className="btn-ghost btn-md mt-6 w-full"
          >
            <LogOut size={16} /> Se déconnecter
          </button>
        </Reveal>
      )}

      {/* --- Zone sensible --- */}
      <Reveal delay={0.22}>
        <div className="mt-8 rounded-2xl border border-terra/30 bg-terra-soft p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={17} className="mt-0.5 shrink-0 text-terra" />
            <div>
              <p className="text-sm font-bold text-terra">Supprimer mon compte</p>
              <p className="mt-1 text-xs leading-relaxed text-ink/60">
                La suppression est définitive : ta boutique, tes produits et ton historique
                sont effacés. Pour lancer la procédure, écris-nous depuis l&apos;onglet Aide en
                choisissant le sujet « Autre ».
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}