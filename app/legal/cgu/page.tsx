import { SITE_DOMAIN, SUPPORT_EMAIL } from "@/lib/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation — Boutik",
  description: "Conditions générales d'utilisation de la plateforme Boutik.",
};

/* Ces CGU sont un point de départ honnête, pas un document validé
   par un juriste. Elles doivent être relues par un professionnel
   avant d'encaisser réellement — notamment sur la responsabilité et
   le droit applicable, qui dépendent du pays d'immatriculation. */
export default function CGU() {
  return (
    <article className="prose-boutik">
      <h1 className="font-display text-3xl font-extrabold">
        Conditions générales d&apos;utilisation
      </h1>
      <p className="mt-2 text-sm text-ink/45">Dernière mise à jour : juillet 2026</p>

      <Section n="1" t="Objet">
        <p>
          Boutik (« la Plateforme ») est un service permettant à un commerçant (« le
          Vendeur ») de créer une boutique en ligne, d&apos;y présenter ses produits et de
          recevoir des commandes de ses clients.
        </p>
        <p>
          <strong>La Plateforme n&apos;est ni vendeur, ni intermédiaire de paiement, ni
          transporteur.</strong> Elle fournit un outil. La vente s&apos;effectue directement
          entre le Vendeur et son client.
        </p>
      </Section>

      <Section n="2" t="Compte">
        <p>
          La création d&apos;un compte requiert une adresse email valide et un mot de passe.
          Le Vendeur est responsable de la confidentialité de ses identifiants et de toute
          activité effectuée depuis son compte.
        </p>
        <p>
          Un compte est personnel. Le Vendeur s&apos;engage à fournir des informations
          exactes et à les tenir à jour.
        </p>
      </Section>

      <Section n="3" t="Abonnement et paiement">
        <ul>
          <li>Les offres et tarifs sont affichés sur la Plateforme, en francs CFA, toutes taxes comprises.</li>
          <li>L&apos;abonnement est mensuel, sans engagement, résiliable à tout moment.</li>
          <li>Le paiement s&apos;effectue par Mobile Money.</li>
          <li>
            <strong>Aucune commission n&apos;est prélevée sur les ventes du Vendeur.</strong>{" "}
            La Plateforme ne perçoit que l&apos;abonnement.
          </li>
          <li>
            En cas de non-paiement : la boutique reste visible 7 jours (période de grâce),
            puis est dépubliée. Les données sont conservées 90 jours, puis supprimées.
          </li>
          <li>
            Les sommes versées ne sont pas remboursables au prorata en cas de résiliation
            en cours de mois.
          </li>
        </ul>
      </Section>

      <Section n="4" t="Contenus interdits">
        <p>Il est interdit de proposer sur la Plateforme :</p>
        <ul>
          <li>des armes, munitions ou explosifs ;</li>
          <li>des stupéfiants, médicaments ou substances réglementées ;</li>
          <li>des contrefaçons ou produits violant un droit de propriété intellectuelle ;</li>
          <li>des contenus à caractère sexuel ;</li>
          <li>des animaux protégés ou produits qui en sont issus (ivoire, écailles…) ;</li>
          <li>des documents officiels, faux papiers ou moyens de paiement ;</li>
          <li>tout produit ou service illégal dans le pays du Vendeur.</li>
        </ul>
        <p>
          Le Vendeur est <strong>seul responsable</strong> de la conformité de ses produits,
          de leur description, de leurs prix et de leur livraison.
        </p>
      </Section>

      <Section n="5" t="Modération">
        <p>
          Tout contenu peut être signalé. La Plateforme se réserve le droit, sans préavis en
          cas de manquement grave, de :
        </p>
        <ul>
          <li>dépublier un produit ;</li>
          <li>suspendre une boutique ;</li>
          <li>résilier un compte.</li>
        </ul>
        <p>
          Aucun remboursement n&apos;est dû en cas de suspension consécutive à une violation
          des présentes conditions.
        </p>
      </Section>

      <Section n="6" t="Relation entre le Vendeur et son client">
        <p>
          Les commandes sont transmises au Vendeur via WhatsApp et son espace vendeur. Le
          paiement et la livraison sont convenus <strong>directement</strong> entre le
          Vendeur et son client, hors de la Plateforme.
        </p>
        <p>
          La Plateforme n&apos;intervient dans aucun litige commercial, de paiement ou de
          livraison. Le bon de commande généré est un document d&apos;organisation et{" "}
          <strong>ne vaut pas facture</strong>.
        </p>
      </Section>

      <Section n="7" t="Disponibilité">
        <p>
          La Plateforme est fournie « en l&apos;état ». Aucune garantie de disponibilité
          continue n&apos;est donnée : le service peut être interrompu pour maintenance ou
          en raison d&apos;un incident indépendant de notre volonté (hébergeur, réseau,
          opérateur Mobile Money).
        </p>
        <p>
          La responsabilité de la Plateforme ne saurait excéder le montant de
          l&apos;abonnement versé au cours des trois derniers mois.
        </p>
      </Section>

      <Section n="8" t="Résiliation">
        <p>
          Le Vendeur peut résilier à tout moment depuis son espace. La suppression du compte
          entraîne l&apos;effacement de la boutique et des produits ; les commandes sont
          anonymisées et conservées douze mois à des fins comptables.
        </p>
      </Section>

      <Section n="9" t="Modification">
        <p>
          Les présentes conditions peuvent évoluer. Toute modification substantielle sera
          notifiée par email au moins quinze jours avant son entrée en vigueur.
        </p>
      </Section>

      <Section n="10" t="Contact">
        <p>
          Pour toute question : <strong>{SUPPORT_EMAIL}</strong> ou via l&apos;onglet Aide
          de l&apos;espace vendeur.
        </p>
      </Section>
    </article>
  );
}

function Section({ n, t, children }: { n: string; t: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-extrabold">
        {n}. {t}
      </h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-ink/70 [&_li]:ml-4 [&_li]:list-disc [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}
