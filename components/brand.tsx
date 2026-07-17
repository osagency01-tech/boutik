"use client";

import Link from "next/link";

/* Logo Boutik. Le fichier est détouré (fond transparent) : il se pose
   aussi bien sur le crème que sur un fond sombre. */
export function BoutikLogo({
  className = "h-7",
  href = "/",
}: {
  className?: string;
  href?: string | null;
}) {
  const img = (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img src="/logo-boutik.png" alt="Boutik" className={`w-auto ${className}`} />
  );
  if (href === null) return img;
  return (
    <Link href={href} className="inline-flex items-center" aria-label="Boutik — accueil">
      {img}
    </Link>
  );
}
