import { NextResponse, type NextRequest } from "next/server";
import { SITE_DOMAIN } from "@/lib/config";

/* ------------------------------------------------------------------ *
 * Sous-domaines de boutique : <slug>.boutik-app.com
 *
 * Le lien qu'un vendeur partage (dashboard "Partager ta boutique",
 * lib/config.ts shopUrl) est un sous-domaine, pas /b/<slug>. Sans ce
 * middleware, rien ne fait le lien entre ce nom d'hôte et la route
 * /b/<slug> qui sait la servir — la requête tombe sur la page d'accueil
 * marketing (ou une 404), pas sur la boutique du vendeur.
 *
 * Ne fait rien en dev/preview (localhost, *.vercel.app, IP locale) :
 * le nom d'hôte ne se termine pas par SITE_DOMAIN, donc on laisse passer.
 * Encore faut-il, côté hébergeur/DNS, qu'un enregistrement générique
 * (*.boutik-app.com) pointe vers ce déploiement — ça, ce fichier ne
 * peut pas le faire à ta place.
 * ------------------------------------------------------------------ */

export function middleware(req: NextRequest) {
  const hostname = req.headers.get("host")?.split(":")[0] ?? "";
  const suffix = `.${SITE_DOMAIN}`;

  if (!hostname.endsWith(suffix)) return NextResponse.next();

  const sub = hostname.slice(0, -suffix.length);
  if (!sub || sub === "www") return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = `/b/${sub}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|manifest.json|sw.js|.*\\.[\\w]+$).*)"],
};
