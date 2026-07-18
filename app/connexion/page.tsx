"use client";

import { BoutikLogo } from "@/components/brand";
import {
  AuthProvider,
  isValidEmail,
  passwordIssue,
  passwordStrength,
  suggestEmailFix,
  useAuth,
} from "@/lib/auth";
import { setRemember } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  ShieldCheck,
  Store,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Page() {
  return (
    <AuthProvider>
      <AuthScreen />
    </AuthProvider>
  );
}

/* Étapes :
   login          -> email + mot de passe (cas normal, aucun email envoyé)
   signup         -> création : email + mot de passe
   confirm-signup -> code reçu à l'inscription
   device-otp     -> mot de passe bon, mais appareil inconnu
   forgot         -> demande de réinitialisation                      */
type Step = "login" | "signup" | "confirm-signup" | "device-otp" | "forgot";

function AuthScreen() {
  const {
    signIn,
    signUp,
    confirmSignUp,
    sendDeviceOtp,
    verifyDeviceOtp,
    resetPassword,
    user,
    loading,
    demoMode,
  } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [code, setCode] = useState("");
  const [remember, setRememberState] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const suggestion = suggestEmailFix(email);

  useEffect(() => {
    /* Ne pas rediriger tant qu'on est sur un écran de code : signInWithPassword
       ouvre brièvement une session avant qu'on la coupe pour exiger l'OTP.
       Sans ce garde, cet instant déclenchait la redirection et l'utilisateur
       ne voyait jamais l'écran du code. */
    if (step === "device-otp" || step === "confirm-signup") return;
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router, step]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const reset = () => {
    setError(null);
    setInfo(null);
  };

  /* ---------- Connexion ---------- */
  const doLogin = async () => {
    if (!isValidEmail(email)) return setError("Entre une adresse email valide.");
    if (!password) return setError("Entre ton mot de passe.");
    setBusy(true);
    reset();
    setRemember(remember);
    const { error, needsOtp } = await signIn(email, password);
    setBusy(false);
    if (error) return setError(error);
    if (needsOtp) {
      setStep("device-otp");
      setCooldown(45);
      return;
    }
    router.replace("/dashboard");
  };

  /* ---------- Inscription ---------- */
  const doSignUp = async () => {
    if (!isValidEmail(email)) return setError("Entre une adresse email valide.");
    const issue = passwordIssue(password);
    if (issue) return setError(issue);
    setBusy(true);
    reset();
    setRemember(remember);
    const { error } = await signUp(email, password);
    setBusy(false);
    if (error) return setError(error);
    setStep("confirm-signup");
    setCooldown(45);
  };

  const doConfirm = async () => {
    if (code.length < 6) return;
    setBusy(true);
    reset();
    const { error } = await confirmSignUp(email, code);
    setBusy(false);
    if (error) {
      setCode("");
      return setError(error);
    }
    router.replace("/creer");
  };

  /* ---------- Nouvel appareil ---------- */
  const doVerifyDevice = async () => {
    if (code.length < 6) return;
    setBusy(true);
    reset();
    const { error } = await verifyDeviceOtp(email, code);
    setBusy(false);
    if (error) {
      setCode("");
      return setError(error);
    }
    router.replace("/dashboard");
  };

  const resend = async () => {
    setBusy(true);
    reset();
    const { error } =
      step === "confirm-signup" ? await signUp(email, password) : await sendDeviceOtp(email);
    setBusy(false);
    if (error) return setError(error);
    setCooldown(45);
    setInfo("Nouveau code envoyé.");
  };

  /* ---------- Mot de passe oublié ---------- */
  const doForgot = async () => {
    if (!isValidEmail(email)) return setError("Entre une adresse email valide.");
    setBusy(true);
    reset();
    const { error } = await resetPassword(email);
    setBusy(false);
    if (error) return setError(error);
    setInfo("Si un compte existe, un lien de réinitialisation vient d'être envoyé.");
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <Loader2 className="animate-spin text-ink/30" />
      </div>
    );

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-5">
        <BoutikLogo className="h-7" />
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-20">
        {demoMode && (
          <div className="mb-5 rounded-xl border border-mango/40 bg-mango-soft px-4 py-3 text-xs leading-relaxed text-yellow-900">
            <strong>Mode démo</strong> — Supabase n&apos;est pas configuré. La connexion est
            désactivée, tu accèdes directement à l&apos;espace vendeur.
            <Link href="/dashboard" className="mt-2 block font-bold underline">
              Continuer vers le dashboard →
            </Link>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ================= CONNEXION ================= */}
          {step === "login" && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <h1 className="font-display text-3xl font-extrabold">Connexion</h1>
              <p className="mt-2 text-sm leading-relaxed text-ink/60">
                Entre ton email et ton mot de passe.
              </p>

              <label className="mb-1.5 mt-7 block text-sm font-bold">Adresse email</label>
              <input
                className="input"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoFocus
                value={email}
                placeholder="nom@gmail.com"
                onChange={(e) => setEmail(e.target.value)}
                disabled={demoMode}
              />
              {suggestion && (
                <button
                  onClick={() => setEmail(suggestion)}
                  className="mt-2 text-xs font-semibold text-primary hover:underline"
                >
                  Tu voulais dire <span className="font-bold">{suggestion}</span> ?
                </button>
              )}

              <label className="mb-1.5 mt-4 block text-sm font-bold">Mot de passe</label>
              <PasswordField
                value={password}
                onChange={setPassword}
                onEnter={doLogin}
                show={showPwd}
                toggle={() => setShowPwd(!showPwd)}
                autoComplete="current-password"
                disabled={demoMode}
              />

              <div className="mt-4 flex items-start justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRememberState(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm">
                    <span className="font-semibold">Rester connecté</span>
                    <span className="block text-xs text-ink/45">
                      Décoche si c&apos;est un téléphone partagé.
                    </span>
                  </span>
                </label>
                <button
                  onClick={() => {
                    setStep("forgot");
                    reset();
                  }}
                  className="shrink-0 pt-0.5 text-xs font-semibold text-ink/50 hover:text-ink"
                >
                  Oublié ?
                </button>
              </div>

              {error && <p className="mt-3 text-sm font-semibold text-terra">{error}</p>}

              <button
                onClick={doLogin}
                disabled={busy || demoMode}
                className="btn-primary btn-lg mt-6 w-full disabled:opacity-40"
              >
                {busy ? <Loader2 size={17} className="animate-spin" /> : <ArrowRight size={17} />}
                Me connecter
              </button>

              <p className="mt-6 text-center text-sm text-ink/55">
                Pas encore de compte ?{" "}
                <button
                  onClick={() => {
                    setStep("signup");
                    reset();
                    setPassword("");
                  }}
                  className="font-bold text-primary hover:underline"
                >
                  Créer un compte
                </button>
              </p>
            </motion.div>
          )}

          {/* ================= INSCRIPTION ================= */}
          {step === "signup" && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button
                onClick={() => {
                  setStep("login");
                  reset();
                  setPassword("");
                }}
                className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 hover:text-ink"
              >
                <ArrowLeft size={15} /> J&apos;ai déjà un compte
              </button>

              <h1 className="font-display text-3xl font-extrabold">Créer mon compte</h1>
              <p className="mt-2 text-sm leading-relaxed text-ink/60">
                Un code de confirmation te sera envoyé par email.
              </p>

              <label className="mb-1.5 mt-7 block text-sm font-bold">Adresse email</label>
              <input
                className="input"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoFocus
                value={email}
                placeholder="nom@gmail.com"
                onChange={(e) => setEmail(e.target.value)}
                disabled={demoMode}
              />
              {suggestion && (
                <button
                  onClick={() => setEmail(suggestion)}
                  className="mt-2 text-xs font-semibold text-primary hover:underline"
                >
                  Tu voulais dire <span className="font-bold">{suggestion}</span> ?
                </button>
              )}

              <label className="mb-1.5 mt-4 block text-sm font-bold">Mot de passe</label>
              <PasswordField
                value={password}
                onChange={setPassword}
                onEnter={doSignUp}
                show={showPwd}
                toggle={() => setShowPwd(!showPwd)}
                autoComplete="new-password"
                disabled={demoMode}
              />
              <StrengthMeter password={password} />

              {error && <p className="mt-3 text-sm font-semibold text-terra">{error}</p>}

              <button
                onClick={doSignUp}
                disabled={busy || demoMode}
                className="btn-primary btn-lg mt-6 w-full disabled:opacity-40"
              >
                {busy ? <Loader2 size={17} className="animate-spin" /> : <ArrowRight size={17} />}
                Créer mon compte
              </button>
            </motion.div>
          )}

          {/* ========== CODE : inscription ou nouvel appareil ========== */}
          {(step === "confirm-signup" || step === "device-otp") && (
            <motion.div
              key="code"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button
                onClick={() => {
                  setStep(step === "confirm-signup" ? "signup" : "login");
                  setCode("");
                  reset();
                }}
                className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 hover:text-ink"
              >
                <ArrowLeft size={15} /> Retour
              </button>

              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  step === "device-otp"
                    ? "bg-mango-soft text-yellow-700"
                    : "bg-primary-soft text-primary"
                }`}
              >
                {step === "device-otp" ? <ShieldCheck size={22} /> : <Mail size={22} />}
              </span>

              <h1 className="mt-5 font-display text-3xl font-extrabold">
                {step === "device-otp" ? "Nouvel appareil" : "Confirme ton email"}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-ink/60">
                {step === "device-otp"
                  ? "On ne reconnaît pas cet appareil. Pour ta sécurité, entre le code envoyé à "
                  : "Entre le code à 6 chiffres envoyé à "}
                <span className="font-bold text-ink">{email}</span>.
              </p>
              <p className="mt-2 text-xs text-ink/45">
                Rien reçu ? Regarde dans les spams ou l&apos;onglet Promotions.
              </p>

              <CodeInput
                value={code}
                onChange={setCode}
                onComplete={step === "device-otp" ? doVerifyDevice : doConfirm}
              />

              {error && (
                <p className="mt-3 text-center text-sm font-semibold text-terra">{error}</p>
              )}
              {info && (
                <p className="mt-3 text-center text-sm font-semibold text-primary">{info}</p>
              )}

              <button
                onClick={step === "device-otp" ? doVerifyDevice : doConfirm}
                disabled={busy || code.length < 6}
                className="btn-primary btn-lg mt-6 w-full disabled:opacity-40"
              >
                {busy ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />}
                Valider
              </button>

              <button
                onClick={resend}
                disabled={cooldown > 0 || busy}
                className="mt-4 w-full text-center text-sm font-semibold text-ink/50 hover:text-ink disabled:opacity-40"
              >
                {cooldown > 0 ? `Renvoyer le code dans ${cooldown} s` : "Renvoyer le code"}
              </button>

              {step === "device-otp" && (
                <p className="mt-5 rounded-xl bg-cream px-4 py-3 text-center text-xs leading-relaxed text-ink/50">
                  Une fois validé, cet appareil sera reconnu : plus besoin de code la prochaine
                  fois.
                </p>
              )}
            </motion.div>
          )}

          {/* ================= MOT DE PASSE OUBLIÉ ================= */}
          {step === "forgot" && (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button
                onClick={() => {
                  setStep("login");
                  reset();
                }}
                className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 hover:text-ink"
              >
                <ArrowLeft size={15} /> Retour à la connexion
              </button>

              <h1 className="font-display text-3xl font-extrabold">Mot de passe oublié</h1>
              <p className="mt-2 text-sm leading-relaxed text-ink/60">
                Entre ton email : on t&apos;envoie un lien pour en choisir un nouveau.
              </p>

              <label className="mb-1.5 mt-7 block text-sm font-bold">Adresse email</label>
              <input
                className="input"
                type="email"
                inputMode="email"
                autoFocus
                value={email}
                placeholder="nom@gmail.com"
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doForgot()}
                disabled={demoMode}
              />

              {error && <p className="mt-3 text-sm font-semibold text-terra">{error}</p>}
              {info && <p className="mt-3 text-sm font-semibold text-primary">{info}</p>}

              <button
                onClick={doForgot}
                disabled={busy || demoMode}
                className="btn-primary btn-lg mt-6 w-full disabled:opacity-40"
              >
                {busy ? <Loader2 size={17} className="animate-spin" /> : <Mail size={17} />}
                Envoyer le lien
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function PasswordField({
  value,
  onChange,
  onEnter,
  show,
  toggle,
  autoComplete,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
  show: boolean;
  toggle: () => void;
  autoComplete: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <input
        className="input pr-12"
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        placeholder="••••••••"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEnter()}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={toggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink/40 transition-colors hover:text-ink"
        aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        tabIndex={-1}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

/* Retour visuel immédiat : mieux qu'un message d'erreur après coup. */
function StrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const s = passwordStrength(password);
  const issue = passwordIssue(password);
  const labels = ["Trop court", "Faible", "Correct", "Solide"];
  const colors = ["bg-terra", "bg-terra", "bg-mango", "bg-primary"];

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              issue ? "bg-ink/10" : i <= s ? colors[s] : "bg-ink/10"
            }`}
          />
        ))}
      </div>
      <p className={`mt-1.5 text-xs ${issue ? "text-ink/45" : "font-semibold text-ink/60"}`}>
        {issue ?? labels[s]}
      </p>
    </div>
  );
}

/* Saisie du code : 6 cases, collage supporté (on copie depuis l'email). */
function CodeInput({
  value,
  onChange,
  onComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete: () => void;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const setDigit = (i: number, d: string) => {
    const clean = d.replace(/\D/g, "");
    if (!clean) return;
    const next = (value.slice(0, i) + clean[0] + value.slice(i + 1)).slice(0, 6);
    onChange(next);
    if (i < 5) refs.current[i + 1]?.focus();
    if (next.length === 6) setTimeout(onComplete, 100);
  };

  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const t = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(t);
    if (t.length === 6) setTimeout(onComplete, 100);
  };

  return (
    <div className="mt-7 flex justify-between gap-2" onPaste={onPaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="h-14 w-full rounded-xl border border-ink/15 bg-white text-center font-display text-xl font-extrabold outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          autoFocus={i === 0}
          value={value[i] ?? ""}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
            if (e.key === "Backspace" && value[i]) onChange(value.slice(0, i) + value.slice(i + 1));
          }}
        />
      ))}
    </div>
  );
}