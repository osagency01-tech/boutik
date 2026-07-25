/* Icône Google officielle (4 couleurs), isolée comme WhatsAppIcon
   (components/phone-icon.tsx) : un SVG inline, aucune dépendance. */
export function GoogleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.82-.07-1.42-.22-2.05H12v3.72h6.61c-.13 1.09-.85 2.74-2.45 3.85l-.02.15 3.56 2.76.25.02c2.26-2.09 3.57-5.16 3.57-8.45"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.94-2.92l-3.79-2.94c-1.01.71-2.37 1.2-4.15 1.2-3.17 0-5.86-2.09-6.82-4.99l-.14.01-3.7 2.87-.05.14C3.25 21.3 7.31 24 12 24"
      />
      <path
        fill="#FBBC05"
        d="M5.18 14.35A7.4 7.4 0 014.77 12c0-.82.14-1.61.4-2.35l-.01-.16-3.75-2.91-.12.06A11.98 11.98 0 000 12c0 1.93.47 3.76 1.29 5.36l3.89-3.01"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c2.26 0 3.78.97 4.65 1.79l3.39-3.31C17.94 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.29 6.64l3.88 3.01c.97-2.9 3.66-4.9 6.83-4.9"
      />
    </svg>
  );
}
