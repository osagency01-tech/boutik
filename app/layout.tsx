import type { Metadata, Viewport } from "next";
import InstallPrompt from "@/components/install-prompt";
import Splash from "@/components/splash";
import ServiceWorkerRegister from "@/components/sw-register";
import { SITE_URL } from "@/lib/config";
import "./globals.css";

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
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="preload"
          href="/fonts/breathing.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <Splash />
        {children}
        <InstallPrompt />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
