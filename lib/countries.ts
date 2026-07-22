/* ==================================================================== *
 *  Pays, indicatifs et opérateurs Mobile Money supportés (via SebPay)
 *
 *  Cette table pilote TOUT : le sélecteur de pays, les opérateurs
 *  proposés, la validation du numéro et sa normalisation.
 *
 *  Règle numéro : on préfixe l'indicatif SANS jamais retirer de chiffre
 *  (le 0 initial fait partie du numéro dans plusieurs pays).
 * ==================================================================== */

export type OperatorInfo = {
  /** Code exact attendu par SebPay (envoyé en .toUpperCase()) */
  code: string;
  /** Nom affiché à l'utilisateur */
  label: string;
  /** Fichier icône dans public/operators/ (ex: "mtn" -> /operators/mtn.png) */
  icon: string;
};

export type CountryInfo = {
  iso: string;        // BJ, CI, BF...
  name: string;       // Bénin, Côte d'Ivoire...
  flag: string;       // emoji drapeau
  dialCode: string;   // 229, 225...
  nsnLength: number;  // nombre de chiffres du numéro local (hors indicatif)
  operators: OperatorInfo[];
};

export const COUNTRIES: CountryInfo[] = [
  {
    iso: "BJ",
    name: "Bénin",
    flag: "🇧🇯",
    dialCode: "229",
    nsnLength: 10,
    operators: [
      { code: "MTN", label: "MTN Money", icon: "mtn" },
      { code: "MOOV", label: "Moov Money", icon: "moov" },
      { code: "CELTIIS", label: "Celtiis Cash", icon: "celtiis" },
    ],
  },
  {
    iso: "CI",
    name: "Côte d'Ivoire",
    flag: "🇨🇮",
    dialCode: "225",
    nsnLength: 10,
    operators: [
      { code: "ORANGE", label: "Orange Money", icon: "orange" },
      { code: "MTN", label: "MTN Money", icon: "mtn" },
      { code: "MOOV", label: "Moov Money", icon: "moov" },
      { code: "WAVE", label: "Wave Money", icon: "wave" },
    ],
  },
  {
    iso: "BF",
    name: "Burkina Faso",
    flag: "🇧🇫",
    dialCode: "226",
    nsnLength: 8,
    operators: [
      { code: "ORANGE", label: "Orange Money", icon: "orange" },
      { code: "MOOV", label: "Moov Money", icon: "moov" },
      { code: "CORIS", label: "Coris Money", icon: "coris" },
      { code: "LIGDICASH", label: "Wallet LigdiCash", icon: "ligdicash" },
    ],
  },
  {
    iso: "CM",
    name: "Cameroun",
    flag: "🇨🇲",
    dialCode: "237",
    nsnLength: 9,
    operators: [
      { code: "MTN", label: "MTN Money", icon: "mtn" },
      { code: "ORANGE", label: "Orange Money", icon: "orange" },
    ],
  },
  {
    iso: "ML",
    name: "Mali",
    flag: "🇲🇱",
    dialCode: "223",
    nsnLength: 8,
    operators: [
      { code: "ORANGE", label: "Orange Money", icon: "orange" },
      { code: "MOOV", label: "Moov Money", icon: "moov" },
    ],
  },
  {
    iso: "SN",
    name: "Sénégal",
    flag: "🇸🇳",
    dialCode: "221",
    nsnLength: 9,
    operators: [
      { code: "ORANGE", label: "Orange Money", icon: "orange" },
      { code: "WAVE", label: "Wave Money", icon: "wave" },
      { code: "FREE", label: "Free Money", icon: "free" },
      { code: "EMONEY", label: "E-money", icon: "emoney" },
    ],
  },
  {
    iso: "NE",
    name: "Niger",
    flag: "🇳🇪",
    dialCode: "227",
    nsnLength: 8,
    operators: [
      { code: "AIRTEL", label: "Airtel Money", icon: "airtel" },
      { code: "MOOV", label: "Moov Money", icon: "moov" },
    ],
  },
  {
    iso: "TG",
    name: "Togo",
    flag: "🇹🇬",
    dialCode: "228",
    nsnLength: 8,
    operators: [
      { code: "TMONEY", label: "T-Money", icon: "tmoney" },
      { code: "MOOV", label: "Moov Money", icon: "moov" },
    ],
  },
];

/** Retrouve un pays par son code ISO. */
export function getCountry(iso: string): CountryInfo | undefined {
  return COUNTRIES.find((c) => c.iso === iso);
}

/**
 * Normalise un numéro pour SebPay : indicatif + numéro local, SANS
 * jamais retirer de chiffre (le 0 initial est conservé).
 * Ex : ("0197112909", pays BJ) -> "2290197112909"
 */
export function normalizePhone(local: string, country: CountryInfo): string {
  const digits = local.replace(/\D/g, "");
  if (digits.startsWith(country.dialCode)) return digits;
  return country.dialCode + digits;
}

/**
 * Valide la longueur du numéro local. Renvoie un message d'erreur
 * clair, ou null si le numéro est valide.
 */
export function validatePhone(local: string, country: CountryInfo): string | null {
  const digits = local.replace(/\D/g, "");
  if (!digits) return "Entre ton numéro de téléphone.";
  if (digits.length !== country.nsnLength) {
    return `Le numéro ${country.name} doit contenir ${country.nsnLength} chiffres (tu en as saisi ${digits.length}).`;
  }
  return null;
}
