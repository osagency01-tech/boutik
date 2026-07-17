import { SUPPORT_EMAIL } from "@/lib/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Boutik",
  description: "Comment Boutik traite les données personnelles.",
};

export default function Confidentialite() {
  return (
    <article>
      <h1 className="font-display text-3xl font-extrabold">Politique de confidentialité</h1>
      <p className="mt-2 text-sm text-ink/45">Dernière mise à jour : juillet 2026</p>

      <Section n="1" t="Qui traite quoi">
        <p>Deux rôles distincts, qui n&apos;engagent pas les mêmes responsabilités :</p>
        <ul>
          <li>
            <strong>Pour les données du Vendeur</strong> (email, boutique, produits) : Boutik
            est responsable de traitement.
          </li>
          <li>
            <strong>Pour les données des clients d&apos;une boutique</strong> (nom, téléphone,
            adresse) : <strong>le Vendeur est responsable de traitement</strong>, Boutik
            n&apos;est que sous-traitant. C&apos;est le Vendeur qui répond de l&apos;usage
            qu&apos;il fait de ces coordonnées.
          </li>
        </ul>
      </Section>

      <Section n="2" t="Données collectées">
        <p><strong>Vendeur :</strong> adresse email, mot de passe (chiffré, jamais lisible en clair), informations de boutique, produits, photos.</p>
        <p><strong>Client d&apos;une boutique :</strong> nom, numéro de téléphone, adresse de livraison, contenu de la commande. Aucun compte n&apos;est créé : ces données sont saisies uniquement pour traiter la commande.</p>
        <p><strong>Technique :</strong> identifiant d&apos;appareil (pour reconnaître un appareil déjà utilisé et éviter de redemander un code à chaque connexion), journaux d&apos;accès.</p>
        <p>
          <strong>Aucun traceur publicitaire, aucun cookie tiers, aucune revente de données.</strong>
        </p>
      </Section>

      <Section n="3" t="Pourquoi">
        <ul>
          <li>Faire fonctionner la boutique et transmettre les commandes ;</li>
          <li>Authentifier le Vendeur et sécuriser son compte ;</li>
          <li>Facturer l&apos;abonnement ;</li>
          <li>Répondre aux demandes d&apos;assistance ;</li>
          <li>Détecter les abus et respecter nos obligations légales.</li>
        </ul>
      </Section>

      <Section n="4" t="Combien de temps">
        <ul>
          <li><strong>Compte vendeur :</strong> tant que le compte existe.</li>
          <li><strong>Boutique suspendue :</strong> 90 jours, puis suppression.</li>
          <li><strong>Commandes :</strong> 12 mois, puis anonymisation automatique des coordonnées client.</li>
          <li><strong>Messages clients :</strong> supprimés 7 jours après lecture, 30 jours s&apos;ils ne sont jamais ouverts.</li>
        </ul>
        <p>Ces purges sont automatiques, pas déclaratives.</p>
      </Section>

      <Section n="5" t="Où sont les données">
        <p>
          Les données sont hébergées dans l&apos;Union européenne (Francfort), chez Supabase
          (infrastructure Amazon Web Services). Les emails transitent par notre prestataire
          d&apos;envoi.
        </p>
      </Section>

      <Section n="6" t="Sécurité">
        <ul>
          <li>Chiffrement en transit (HTTPS obligatoire) et au repos ;</li>
          <li>Cloisonnement strict entre boutiques appliqué au niveau de la base : un vendeur ne peut techniquement pas accéder aux données d&apos;un autre ;</li>
          <li>Mots de passe hachés, jamais stockés en clair ;</li>
          <li>Journalisation des actions d&apos;administration.</li>
        </ul>
        <p className="text-ink/50">
          Aucun système n&apos;est invulnérable. En cas de violation de données présentant un
          risque, les personnes concernées et les autorités compétentes seront informées.
        </p>
      </Section>

      <Section n="7" t="Tes droits">
        <p>
          Accès, rectification, effacement, portabilité, opposition. Écris à{" "}
          <strong>{SUPPORT_EMAIL}</strong> : réponse sous 30 jours.
        </p>
        <p>
          <strong>Client d&apos;une boutique :</strong> adresse-toi d&apos;abord au vendeur
          concerné, qui est responsable de tes données. Si tu n&apos;obtiens pas de réponse,
          écris-nous.
        </p>
      </Section>

      <Section n="8" t="Stockage sur ton appareil">
        <p>
          Boutik n&apos;utilise <strong>aucun cookie publicitaire</strong>. Seul un stockage
          technique local est utilisé : session de connexion, panier en cours, préférences.
          Il est nécessaire au fonctionnement du service et ne sert à aucun suivi.
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
