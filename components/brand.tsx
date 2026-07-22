import Image from "next/image";
import Link from "next/link";

/* Logo Boutik. Le fichier est détouré (fond transparent) : il se pose
   aussi bien sur le crème que sur un fond sombre.

   next/image sert un AVIF/WebP redimensionné au lieu du PNG brut, et
   les dimensions explicites suppriment le décalage de mise en page.
   `priority` uniquement pour le logo du header : c'est un candidat LCP. */
export function BoutikLogo({
  className = "h-7",
  href = "/",
  priority = false,
}: {
  className?: string;
  href?: string | null;
  priority?: boolean;
}) {
  const img = (
    <Image
      src="/logo-boutik.png"
      alt="Boutik"
      width={120}
      height={32}
      priority={priority}
      className={`w-auto ${className}`}
    />
  );
  if (href === null) return img;
  return (
    <Link href={href} className="inline-flex items-center" aria-label="Boutik — accueil">
      {img}
    </Link>
  );
}