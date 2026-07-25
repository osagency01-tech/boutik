/* ==================================================================== *
 *  Pays de la CEDEAO — sélecteur générique de numéro de téléphone
 *
 *  Indépendant de lib/countries.ts (qui pilote spécifiquement le
 *  paiement Mobile Money via SebPay, avec ses propres opérateurs) :
 *  celui-ci sert au numéro WhatsApp de la boutique et à tout endroit
 *  qui a juste besoin d'un indicatif + d'une validation de longueur,
 *  sans lien avec le paiement.
 *
 *  `nsnLengths` est un TABLEAU (pas un seul nombre) : le Bénin accepte
 *  aussi bien l'ancien format à 8 chiffres que le nouveau à 10.
 *
 *  Indicatifs (E.164) bien établis pour tous les pays. Les longueurs
 *  de numéro mobile national sont bien documentées sauf pour la Guinée
 *  et le Liberia (plans de numérotation moins standardisés) — à
 *  corriger si un vendeur de ces pays signale un rejet à tort.
 * ==================================================================== */

export type EcowasCountry = {
  iso: string;
  name: string;
  flag: string;
  dialCode: string;
  nsnLengths: number[];
};

export const ECOWAS_COUNTRIES: EcowasCountry[] = [
  { iso: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", dialCode: "225", nsnLengths: [10] },
  { iso: "BJ", name: "Bénin", flag: "🇧🇯", dialCode: "229", nsnLengths: [8, 10] },
  { iso: "BF", name: "Burkina Faso", flag: "🇧🇫", dialCode: "226", nsnLengths: [8] },
  { iso: "CV", name: "Cap-Vert", flag: "🇨🇻", dialCode: "238", nsnLengths: [7] },
  { iso: "GM", name: "Gambie", flag: "🇬🇲", dialCode: "220", nsnLengths: [7] },
  { iso: "GH", name: "Ghana", flag: "🇬🇭", dialCode: "233", nsnLengths: [9] },
  /* Guinée : plan de numérotation moins standardisé, 8 ou 9 chiffres selon l'opérateur. */
  { iso: "GN", name: "Guinée", flag: "🇬🇳", dialCode: "224", nsnLengths: [8, 9] },
  { iso: "GW", name: "Guinée-Bissau", flag: "🇬🇼", dialCode: "245", nsnLengths: [7] },
  /* Liberia : source moins fiable, 7 ou 8 chiffres selon l'opérateur. */
  { iso: "LR", name: "Liberia", flag: "🇱🇷", dialCode: "231", nsnLengths: [7, 8] },
  { iso: "ML", name: "Mali", flag: "🇲🇱", dialCode: "223", nsnLengths: [8] },
  { iso: "NE", name: "Niger", flag: "🇳🇪", dialCode: "227", nsnLengths: [8] },
  { iso: "NG", name: "Nigeria", flag: "🇳🇬", dialCode: "234", nsnLengths: [10] },
  { iso: "SN", name: "Sénégal", flag: "🇸🇳", dialCode: "221", nsnLengths: [9] },
  { iso: "SL", name: "Sierra Leone", flag: "🇸🇱", dialCode: "232", nsnLengths: [8] },
  { iso: "TG", name: "Togo", flag: "🇹🇬", dialCode: "228", nsnLengths: [8] },
];

export function getEcowasCountry(iso: string): EcowasCountry | undefined {
  return ECOWAS_COUNTRIES.find((c) => c.iso === iso);
}

/** Retrouve le pays dont l'indicatif préfixe une chaîne de chiffres déjà composée. */
export function findEcowasCountryByDigits(digits: string): EcowasCountry | undefined {
  return ECOWAS_COUNTRIES.find((c) => digits.startsWith(c.dialCode));
}

const formatLengths = (lengths: number[]) =>
  lengths.length === 1 ? `${lengths[0]} chiffres` : `${lengths.join(" ou ")} chiffres`;

/** Valide la longueur du numéro local. Renvoie un message d'erreur clair, ou null si valide. */
export function validateEcowasPhone(local: string, country: EcowasCountry): string | null {
  const digits = local.replace(/\D/g, "");
  if (!digits) return "Entre ton numéro de téléphone.";
  if (!country.nsnLengths.includes(digits.length)) {
    return `Le numéro ${country.name} doit contenir ${formatLengths(country.nsnLengths)} (tu en as saisi ${digits.length}).`;
  }
  return null;
}

/** Indicatif + numéro local, sans jamais retirer de chiffre. */
export function normalizeEcowasPhone(local: string, country: EcowasCountry): string {
  const digits = local.replace(/\D/g, "");
  if (digits.startsWith(country.dialCode)) return digits;
  return country.dialCode + digits;
}
