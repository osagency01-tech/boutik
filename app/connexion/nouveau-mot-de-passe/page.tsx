"use client";

import { BoutikLogo } from "@/components/brand";
import { AuthProvider, passwordIssue, passwordStrength, rememberDevice, useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Check, Eye, EyeOff, KeyRound, Loader2, Store } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  return (
    <AuthProvider>
      <NewPassword />
    </AuthProvider>
  );
}

/* Le lien de réinitialisation ouvre une session temporaire côté Supabase.
   On s'en sert pour poser le nouveau mot de passe, puis on renvoie
   l'utilisateur vers son dashboard. */
function NewPassword() {
  const { user, loading, demoMode } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  /* Sans session, le lien est invalide ou expiré. */
  useEffect(() => {
    if (!loading && !user && !demoMode) {
      setError("Ce lien a expiré ou a déjà été utilisé. Demandes-en un nouveau.");
    }
  }, [loading, user, demoMode]);

  const save = async () => {
    const issue = passwordIssue(password);
    if (issue) return setError(issue);

    const sb = supabase();
    if (!sb) return;

    setBusy(true);
    setError(null);
    const { error } = await sb.auth.updateUser({ password });
    setBusy(false);

    if (error) {
      setError("Le mot de passe n'a pas pu être changé. Réessaie.");
      return;
    }
    /* L'appareil qui vient de réinitialiser est de confiance :
       inutile de redemander un code juste après. */
    if (user?.email) rememberDevice(user.email);
    setDone(true);
    setTimeout(() => router.replace("/dashboard"), 1600);
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <Loader2 className="animate-spin text-ink/30" />
      </div>
    );

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="mx-auto flex w-full max-w-md items-center px-4 py-5">
        <BoutikLogo className="h-7" />
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-20">
        {done ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white">
              <Check size={30} strokeWidth={3} />
            </span>
            <h1 className="mt-5 font-display text-2xl font-extrabold">Mot de passe changé</h1>
            <p className="mt-2 text-sm text-ink/60">Redirection vers ton espace vendeur…</p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <KeyRound size={22} />
            </span>
            <h1 className="mt-5 font-display text-3xl font-extrabold">Nouveau mot de passe</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink/60">
              Choisis un mot de passe que tu retiendras. 8 caractères minimum, avec au moins une
              lettre et un chiffre.
            </p>

            <label className="mb-1.5 mt-7 block text-sm font-bold">Mot de passe</label>
            <div className="relative">
              <input
                className="input pr-12"
                type={show ? "text" : "password"}
                autoComplete="new-password"
                autoFocus
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
                disabled={!user && !demoMode}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink/40 hover:text-ink"
                tabIndex={-1}
                aria-label={show ? "Masquer" : "Afficher"}
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {password && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => {
                    const s = passwordStrength(password);
                    const issue = passwordIssue(password);
                    const colors = ["bg-terra", "bg-terra", "bg-mango", "bg-primary"];
                    return (
                      <span
                        key={i}
                        className={`h-1 flex-1 rounded-full ${
                          issue ? "bg-ink/10" : i <= s ? colors[s] : "bg-ink/10"
                        }`}
                      />
                    );
                  })}
                </div>
                <p className="mt-1.5 text-xs text-ink/50">
                  {passwordIssue(password) ?? ["Trop court", "Faible", "Correct", "Solide"][passwordStrength(password)]}
                </p>
              </div>
            )}

            {error && <p className="mt-3 text-sm font-semibold text-terra">{error}</p>}

            <button
              onClick={save}
              disabled={busy || (!user && !demoMode)}
              className="btn-primary btn-lg mt-6 w-full disabled:opacity-40"
            >
              {busy ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />}
              Enregistrer
            </button>

            <Link
              href="/connexion"
              className="mt-4 block text-center text-sm font-semibold text-ink/50 hover:text-ink"
            >
              Retour à la connexion
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
