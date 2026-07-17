import { BoutikLogo } from "@/components/brand";
import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-ink/5 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <BoutikLogo className="h-7" />
          <Link href="/" className="text-sm font-semibold text-ink/50 hover:text-ink">
            Retour au site
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 pb-20">{children}</main>
      <footer className="border-t border-ink/5 bg-white py-6">
        <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-5 px-4 text-xs font-medium text-ink/50">
          <Link href="/legal/cgu" className="hover:text-ink">Conditions générales</Link>
          <Link href="/legal/confidentialite" className="hover:text-ink">Confidentialité</Link>
          <Link href="/dashboard/aide" className="hover:text-ink">Aide</Link>
        </div>
      </footer>
    </div>
  );
}
