import { SITE_URL } from "@/lib/config";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        /* L'espace vendeur et l'auth n'ont rien à faire dans Google :
           pas de contenu public, et autant ne pas exposer la surface. */
        disallow: ["/dashboard/", "/connexion", "/creer", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
