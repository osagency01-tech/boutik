import type { Metadata, Viewport } from "next";
import dynamic from "next/dynamic";
import { Bricolage_Grotesque } from "next/font/google";
import localFont from "next/font/local";
import { SITE_URL } from "@/lib/config";
import "./globals.css";

/* ------------------------------------------------------------------ *
 * Polices
 *
 * next/font télécharge les fichiers au build et les sert depuis notre
 * domaine : plus d'aller-retour vers fonts.googleapis.com puis
 * fonts.gstatic.com avant le premier pixel (~1,8 s gagnées en 4G).
 * Le CSS est inliné dans la page, donc plus rien ne bloque le rendu.
 *
 * Geomini (texte courant, remplace Inter) n'est pas encore dans la
 * liste de polices intégrée à cette version de Next — trop récente
 * sur Google Fonts. Le fichier variable est donc auto-hébergé ici
 * (public/fonts/geomini.woff2, téléchargé depuis fonts.gstatic.com)
 * et servi via next/font/local, qui donne les mêmes optimisations
 * (préchargement, font-display: swap) que next/font/google.
 * ------------------------------------------------------------------ */

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const geomini = localFont({
  src: "../public/fonts/geomini.woff2",
  weight: "400 700",
  variable: "--font-sans",
  display: "swap",
});

/* Ni l'un ni l'autre n'est visible au chargement : hors du bundle initial. */
const InstallPrompt = dynamic(() => import("@/components/install-prompt"), { ssr: false });
const ServiceWorkerRegister = dynamic(() => import("@/components/sw-register"), { ssr: false });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Boutik — Ta boutique en ligne, prête en 10 minutes",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.png", apple: "/icon-192.png" },
  appleWebApp: { capable: true, title: "Boutik", statusBarStyle: "default" },
  openGraph: {
    title: "Boutik — Ta boutique en ligne, prête en 10 minutes",
    description:
      "Crée ta boutique professionnelle sans coder et reçois tes commandes sur WhatsApp. À partir de 999 FCFA/mois.",
    images: ["/icon-512.png"],
    locale: "fr_FR",
    type: "website",
  },
  description:
    "Crée ta boutique en ligne professionnelle, reçois tes commandes sur WhatsApp et gère tout depuis ton téléphone. Pensé pour les vendeurs africains. À partir de 999 FCFA/mois.",
};

export const viewport: Viewport = {
  themeColor: "#0E8A52",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${bricolage.variable} ${geomini.variable}`}>
      <body>
        {children}
        <InstallPrompt />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}