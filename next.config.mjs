/** @type {import('next').NextConfig} */

/* ------------------------------------------------------------------ *
 * En-têtes de sécurité
 *
 * Première barrière : appliqués à chaque réponse, avant même que le
 * code applicatif s'exécute. Protègent contre le clickjacking, le
 * sniffing MIME, l'injection de scripts tiers et la fuite d'infos
 * par le Referer.
 * ------------------------------------------------------------------ */

const SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const isProd = process.env.NODE_ENV === "production";

const csp = [
  "default-src 'self'",

  /* 'unsafe-inline'/'unsafe-eval' sont exigés par Next (hydratation,
     Fast Refresh). Les retirer casse l'app. Le vrai garde-fou reste
     de ne jamais injecter de HTML brut : aucun dangerouslySetInnerHTML
     dans le projet (vérifié). */
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",

  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",

  /* data: = aperçu d'image avant upload ; blob: = PDF généré côté client */
  `img-src 'self' data: blob: ${SUPABASE} https://*.supabase.co`,

  /* Le navigateur ne peut appeler QUE notre backend. Si un script
     malveillant s'exécutait, il ne pourrait pas exfiltrer les données
     vers un serveur tiers. */
  `connect-src 'self' ${SUPABASE} https://*.supabase.co wss://*.supabase.co`,

  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",

  /* Clickjacking : personne ne peut encadrer le site pour faire
     cliquer le vendeur à son insu. */
  "frame-ancestors 'none'",

  /* Uniquement en production : en dev, le téléphone accède au site
     via http://192.168.x.x:3000. Cette directive réécrirait les URL
     en https, que le serveur de dev ne parle pas — d'où une page
     blanche sans CSS. */
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].filter(Boolean).join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },

  /* HSTS : uniquement en production. En dev, le navigateur mémoriserait
     la règle pendant 2 ans et refuserait ensuite tout accès en http
     à cette IP — y compris pour d'autres projets. */
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),

  /* Un .jpg piégé ne sera jamais exécuté comme du script. */
  { key: "X-Content-Type-Options", value: "nosniff" },

  { key: "X-Frame-Options", value: "DENY" },

  /* Ne fuite pas l'URL complète vers les tiers (ex. WhatsApp). */
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  /* Tout coupé sauf la caméra (photo produit). */
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=()",
  },

  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig = {
  reactStrictMode: true,

  /* Ne pas annoncer la version de Next : autant ne pas indiquer aux
     robots quelles failles tester. */
  poweredByHeader: false,
  compress: true,

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        /* Images : cache long, elles changent rarement et pèsent lourd
           sur les forfaits data. */
        source: "/:all*(png|jpg|jpeg|webp|avif|svg|ico)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
