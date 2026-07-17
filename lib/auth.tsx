"use client";

import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "./supabase";

/* ------------------------------------------------------------------ *
 * Authentification
 *
 * Modèle retenu :
 *   - Inscription : email + mot de passe, confirmé par un code OTP.
 *   - Connexion habituelle : email + mot de passe. Aucun email envoyé.
 *   - Connexion depuis un appareil inconnu : code OTP envoyé par email.
 *
 * Pourquoi : un OTP à chaque connexion coûte un email à chaque fois.
 * Ici on n'en envoie qu'à l'inscription et sur nouvel appareil, soit
 * une poignée par vendeur et par an.
 *
 * Limite honnête : l'empreinte d'appareil vit dans le navigateur.
 * Elle protège contre un mot de passe volé utilisé ailleurs, pas
 * contre quelqu'un qui a déjà le téléphone déverrouillé du vendeur.
 * ------------------------------------------------------------------ */

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  demoMode: boolean;

  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  confirmSignUp: (email: string, code: string) => Promise<{ error?: string }>;

  /* needsOtp = mot de passe correct, mais appareil inconnu. */
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error?: string; needsOtp?: boolean }>;
  sendDeviceOtp: (email: string) => Promise<{ error?: string }>;
  verifyDeviceOtp: (email: string, code: string) => Promise<{ error?: string }>;

  resetPassword: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export const isValidEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

/* Le mot de passe remplace l'OTP à chaque connexion : c'est devenu
   le maillon faible, donc on impose un minimum. */
export function passwordIssue(p: string): string | null {
  if (p.length < 8) return "8 caractères minimum.";
  if (!/[a-zA-Z]/.test(p)) return "Ajoute au moins une lettre.";
  if (!/[0-9]/.test(p)) return "Ajoute au moins un chiffre.";
  return null;
}

export function passwordStrength(p: string): 0 | 1 | 2 | 3 {
  if (p.length < 8) return 0;
  let score = 0;
  if (p.length >= 12) score++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p) && /[^a-zA-Z0-9]/.test(p)) score++;
  return Math.max(1, Math.min(3, score)) as 1 | 2 | 3;
}

const COMMON_TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmail.co": "gmail.com",
  gmailcom: "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "yaho.com": "yahoo.com",
  "yahou.com": "yahoo.com",
  "outlok.com": "outlook.com",
  "outloook.com": "outlook.com",
};

export function suggestEmailFix(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 0) return null;
  const domain = email.slice(at + 1).toLowerCase();
  const fix = COMMON_TYPOS[domain];
  return fix ? email.slice(0, at + 1) + fix : null;
}

/* ------------------------------------------------------------------ *
 * Empreinte d'appareil
 *
 * Un jeton aléatoire posé au premier passage, et la liste des
 * appareils reconnus par compte. Pas de fingerprinting invasif :
 * on répond juste à « ai-je déjà vu ce navigateur avec ce compte ? ».
 * ------------------------------------------------------------------ */

const DEVICE_KEY = "boutik-device-id";
const KNOWN_KEY = "boutik-known-devices";

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id =
        (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)) +
        "-" +
        Date.now().toString(36);
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return "no-storage";
  }
}

export function isKnownDevice(email: string): boolean {
  try {
    const raw = localStorage.getItem(KNOWN_KEY);
    if (!raw) return false;
    const map = JSON.parse(raw) as Record<string, string[]>;
    return (map[email.trim().toLowerCase()] ?? []).includes(getDeviceId());
  } catch {
    return false;
  }
}

export function rememberDevice(email: string) {
  try {
    const raw = localStorage.getItem(KNOWN_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    const key = email.trim().toLowerCase();
    const list = new Set(map[key] ?? []);
    list.add(getDeviceId());
    map[key] = Array.from(list);
    localStorage.setItem(KNOWN_KEY, JSON.stringify(map));
  } catch {
    /* Navigation privée : l'OTP sera redemandé. C'est voulu. */
  }
}

export function forgetDevices(email: string) {
  try {
    const raw = localStorage.getItem(KNOWN_KEY);
    if (!raw) return;
    const map = JSON.parse(raw) as Record<string, string[]>;
    delete map[email.trim().toLowerCase()];
    localStorage.setItem(KNOWN_KEY, JSON.stringify(map));
  } catch {}
}

/* ------------------------------------------------------------------ */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const demoMode = !isSupabaseConfigured;

  useEffect(() => {
    const sb = supabase();
    if (!sb) {
      setLoading(false);
      return;
    }

    sb.auth.getSession().then(({ data }: any) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = sb.auth.onAuthStateChange(
      (_e: string, s: Session | null) => {
        setSession(s);
        setUser(s?.user ?? null);
      }
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const humanError = (msg: string) => {
    const m = msg.toLowerCase();
    if (m.includes("rate") || m.includes("limit"))
      return "Trop de tentatives. Réessaie dans quelques minutes.";
    if (m.includes("already registered") || m.includes("already been registered"))
      return "Un compte existe déjà avec cet email. Connecte-toi.";
    if (m.includes("invalid login") || m.includes("invalid credentials"))
      return "Email ou mot de passe incorrect.";
    if (m.includes("not confirmed"))
      return "Ton compte n'est pas encore confirmé. Vérifie tes emails.";
    if (m.includes("expired")) return "Ce code a expiré. Demandes-en un nouveau.";
    if (m.includes("token") || m.includes("otp"))
      return "Code incorrect. Vérifie les 6 chiffres.";
    if (m.includes("weak") || m.includes("password"))
      return "Mot de passe trop faible.";
    return "Une erreur est survenue. Vérifie ta connexion et réessaie.";
  };

  /* ---------- Inscription ---------- */

  const signUp = async (email: string, password: string) => {
    const sb = supabase();
    if (!sb) return {};
    const { error } = await sb.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) return { error: humanError(error.message) };
    return {};
  };

  const confirmSignUp = async (email: string, code: string) => {
    const sb = supabase();
    if (!sb) return {};
    const { error } = await sb.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code,
      type: "signup",
    });
    if (error) return { error: humanError(error.message) };
    rememberDevice(email); // l'appareil d'inscription est de confiance
    return {};
  };

  /* ---------- Connexion ---------- */

  const signIn = async (email: string, password: string) => {
    const sb = supabase();
    if (!sb) return {};

    const clean = email.trim().toLowerCase();
    const { error } = await sb.auth.signInWithPassword({
      email: clean,
      password,
    });
    if (error) return { error: humanError(error.message) };

    /* Mot de passe bon mais appareil inconnu : on coupe la session
       et on exige un code. Sans cette déconnexion, la vérification
       serait cosmétique — la session serait déjà ouverte. */
    if (!isKnownDevice(clean)) {
      await sb.auth.signOut();
      const { error: otpError } = await sb.auth.signInWithOtp({
        email: clean,
        options: { shouldCreateUser: false },
      });
      if (otpError) return { error: humanError(otpError.message) };
      return { needsOtp: true };
    }

    return {};
  };

  const sendDeviceOtp = async (email: string) => {
    const sb = supabase();
    if (!sb) return {};
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false },
    });
    if (error) return { error: humanError(error.message) };
    return {};
  };

  const verifyDeviceOtp = async (email: string, code: string) => {
    const sb = supabase();
    if (!sb) return {};
    const clean = email.trim().toLowerCase();
    const { error } = await sb.auth.verifyOtp({
      email: clean,
      token: code,
      type: "email",
    });
    if (error) return { error: humanError(error.message) };
    rememberDevice(clean); // plus d'OTP sur cet appareil
    return {};
  };

  const resetPassword = async (email: string) => {
    const sb = supabase();
    if (!sb) return {};
    const { error } = await sb.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/connexion/nouveau-mot-de-passe`
            : undefined,
      }
    );
    if (error) return { error: humanError(error.message) };
    return {};
  };

  const signOut = async () => {
    const sb = supabase();
    if (sb) await sb.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <Ctx.Provider
      value={{
        user,
        session,
        loading,
        demoMode,
        signUp,
        confirmSignUp,
        signIn,
        sendDeviceOtp,
        verifyDeviceOtp,
        resetPassword,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
