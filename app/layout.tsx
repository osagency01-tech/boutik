import type { Metadata, Viewport } from "next";
import dynamic from "next/dynamic";
import Script from "next/script";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { SITE_URL } from "@/lib/config";
import "./globals.css";

/* Uniquement en production : pas de trafic de développement/tests dans
   les statistiques, et aucune requête réseau superflue en local. */
const GA_ID = "G-C8GG85X53D";

/* ------------------------------------------------------------------ *
 * Polices
 *
 * next/font télécharge les fichiers au build et les sert depuis notre
 * domaine : plus d'aller-retour vers fonts.googleapis.com puis
 * fonts.gstatic.com avant le premier pixel (~1,8 s gagnées en 4G).
 * Le CSS est inliné dans la page, donc plus rien ne bloque le rendu.
 * ------------------------------------------------------------------ */

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

/* Pas visible au chargement : hors du bundle initial. InstallPrompt
   (le bandeau "Installe Boutik pour recevoir tes commandes") n'est PAS
   monté ici : c'est un message pour le VENDEUR, il vivait par erreur
   sur toutes les pages y compris la boutique publique, où un acheteur
   venu payer se le voyait afficher. Monté uniquement dans
   app/dashboard/layout.tsx désormais. */
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
    <html lang="fr" className={`${bricolage.variable} ${inter.variable}`}>
      <body>
        {children}
        <ServiceWorkerRegister />
        {process.env.NODE_ENV === "production" && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}