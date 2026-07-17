import { SITE_URL } from "@/lib/config";
import { TEMPLATE_INFO } from "@/lib/templates";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    /* Les aperçus de modèles sont du contenu public indexable :
       autant de portes d'entrée vers l'inscription. */
    ...TEMPLATE_INFO.map((t) => ({
      url: `${SITE_URL}/apercu/${t.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
