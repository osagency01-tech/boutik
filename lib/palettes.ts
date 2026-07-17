/* ------------------------------------------------------------------ *
 * Palettes de boutique
 *
 * Chaque palette est un ensemble cohérent, pas une couleur isolée :
 * le vendeur choisit une ambiance, la boutique entière suit.
 *
 *  accent   : actions, prix, liens          (doit ressortir sur surface)
 *  accent2  : dégradé de bannière           (harmonique de accent)
 *  bg       : fond de page                  (très clair, jamais blanc pur)
 *  surface  : cartes, en-tête               (blanc ou proche)
 *  ink      : texte principal               (contraste AA sur bg)
 *  muted    : texte secondaire              (dérivé d'ink)
 *  onAccent : texte posé sur accent         (blanc ou ink selon luminance)
 * ------------------------------------------------------------------ */

export type Palette = {
  id: string;
  name: string;
  family: "Chaleureux" | "Naturel" | "Élégant" | "Vif" | "Doux";
  accent: string;
  accent2: string;
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  onAccent: string;
};

export const PALETTES: Palette[] = [
  /* ---------- Chaleureux ---------- */
  {
    id: "terracotta",
    name: "Terracotta",
    family: "Chaleureux",
    accent: "#C2553A",
    accent2: "#E08A5F",
    bg: "#FBF6F2",
    surface: "#FFFFFF",
    ink: "#2A1A14",
    muted: "#6B564C",
    onAccent: "#FFFFFF",
  },
  {
    id: "harmattan",
    name: "Harmattan",
    family: "Chaleureux",
    accent: "#B5642C",
    accent2: "#E9A23B",
    bg: "#FDF8EF",
    surface: "#FFFFFF",
    ink: "#2C1F10",
    muted: "#6E5B44",
    onAccent: "#FFFFFF",
  },
  {
    id: "hibiscus",
    name: "Hibiscus",
    family: "Chaleureux",
    accent: "#B8324F",
    accent2: "#E4677F",
    bg: "#FDF4F5",
    surface: "#FFFFFF",
    ink: "#2B141A",
    muted: "#6D4C53",
    onAccent: "#FFFFFF",
  },
  {
    id: "cuivre",
    name: "Cuivre",
    family: "Chaleureux",
    accent: "#9C5528",
    accent2: "#CE8B4E",
    bg: "#FAF5F0",
    surface: "#FFFFFF",
    ink: "#2A1C12",
    muted: "#6B5647",
    onAccent: "#FFFFFF",
  },
  {
    id: "coucher",
    name: "Coucher de soleil",
    family: "Chaleureux",
    accent: "#D2461F",
    accent2: "#F5A25D",
    bg: "#FEF6F0",
    surface: "#FFFFFF",
    ink: "#2E1810",
    muted: "#71544A",
    onAccent: "#FFFFFF",
  },

  /* ---------- Naturel ---------- */
  {
    id: "marche",
    name: "Vert marché",
    family: "Naturel",
    accent: "#0E8A52",
    accent2: "#46B37B",
    bg: "#F5F9F6",
    surface: "#FFFFFF",
    ink: "#14231B",
    muted: "#4F6559",
    onAccent: "#FFFFFF",
  },
  {
    id: "palmeraie",
    name: "Palmeraie",
    family: "Naturel",
    accent: "#2F6B3C",
    accent2: "#6FA76B",
    bg: "#F6F9F4",
    surface: "#FFFFFF",
    ink: "#18231A",
    muted: "#556458",
    onAccent: "#FFFFFF",
  },
  {
    id: "savane",
    name: "Savane",
    family: "Naturel",
    accent: "#7A7A29",
    accent2: "#B5B455",
    bg: "#FAFAF1",
    surface: "#FFFFFF",
    ink: "#242414",
    muted: "#5F5F45",
    onAccent: "#FFFFFF",
  },
  {
    id: "lagune",
    name: "Lagune",
    family: "Naturel",
    accent: "#0C7A75",
    accent2: "#48ACA3",
    bg: "#F3F9F8",
    surface: "#FFFFFF",
    ink: "#12241F",
    muted: "#4C635E",
    onAccent: "#FFFFFF",
  },
  {
    id: "argile",
    name: "Argile",
    family: "Naturel",
    accent: "#8A6A4F",
    accent2: "#BC9B7A",
    bg: "#FAF7F3",
    surface: "#FFFFFF",
    ink: "#251E16",
    muted: "#655749",
    onAccent: "#FFFFFF",
  },
  {
    id: "foret",
    name: "Forêt",
    family: "Naturel",
    accent: "#1F5B4A",
    accent2: "#5C9C83",
    bg: "#F4F8F6",
    surface: "#FFFFFF",
    ink: "#13211C",
    muted: "#4B615A",
    onAccent: "#FFFFFF",
  },

  /* ---------- Élégant ---------- */
  {
    id: "encre",
    name: "Encre",
    family: "Élégant",
    accent: "#1F2933",
    accent2: "#57646F",
    bg: "#F7F8F8",
    surface: "#FFFFFF",
    ink: "#12181D",
    muted: "#5A646C",
    onAccent: "#FFFFFF",
  },
  {
    id: "or-noir",
    name: "Or & noir",
    family: "Élégant",
    accent: "#A6842C",
    accent2: "#D6B75B",
    bg: "#FAF8F1",
    surface: "#FFFFFF",
    ink: "#1E1B12",
    muted: "#5D5744",
    onAccent: "#FFFFFF",
  },
  {
    id: "bordeaux",
    name: "Bordeaux",
    family: "Élégant",
    accent: "#7A2036",
    accent2: "#AE4F63",
    bg: "#FBF5F6",
    surface: "#FFFFFF",
    ink: "#241318",
    muted: "#644A50",
    onAccent: "#FFFFFF",
  },
  {
    id: "ardoise",
    name: "Ardoise",
    family: "Élégant",
    accent: "#41566B",
    accent2: "#7B90A5",
    bg: "#F6F8FA",
    surface: "#FFFFFF",
    ink: "#161D24",
    muted: "#556370",
    onAccent: "#FFFFFF",
  },
  {
    id: "prune",
    name: "Prune",
    family: "Élégant",
    accent: "#5B3A6E",
    accent2: "#8F6BA3",
    bg: "#F9F6FB",
    surface: "#FFFFFF",
    ink: "#1E1523",
    muted: "#5B4F65",
    onAccent: "#FFFFFF",
  },

  /* ---------- Vif ---------- */
  {
    id: "indigo",
    name: "Indigo",
    family: "Vif",
    accent: "#3A47C4",
    accent2: "#7A85E8",
    bg: "#F5F6FD",
    surface: "#FFFFFF",
    ink: "#151731",
    muted: "#54587A",
    onAccent: "#FFFFFF",
  },
  {
    id: "cobalt",
    name: "Cobalt",
    family: "Vif",
    accent: "#1668C4",
    accent2: "#5CA0E4",
    bg: "#F3F8FD",
    surface: "#FFFFFF",
    ink: "#122031",
    muted: "#4C5F72",
    onAccent: "#FFFFFF",
  },
  {
    id: "magenta",
    name: "Magenta",
    family: "Vif",
    accent: "#B3268C",
    accent2: "#E066B8",
    bg: "#FDF4FA",
    surface: "#FFFFFF",
    ink: "#2A1024",
    muted: "#6B4A62",
    onAccent: "#FFFFFF",
  },
  {
    id: "mandarine",
    name: "Mandarine",
    family: "Vif",
    accent: "#D2600A",
    accent2: "#F8A340",
    bg: "#FEF8F1",
    surface: "#FFFFFF",
    ink: "#2B1B0C",
    muted: "#6D5844",
    onAccent: "#FFFFFF",
  },
  {
    id: "turquoise",
    name: "Turquoise",
    family: "Vif",
    accent: "#0891A8",
    accent2: "#4FC3D6",
    bg: "#F2FAFC",
    surface: "#FFFFFF",
    ink: "#0F2429",
    muted: "#496168",
    onAccent: "#FFFFFF",
  },

  /* ---------- Doux ---------- */
  {
    id: "rose-poudre",
    name: "Rose poudré",
    family: "Doux",
    accent: "#C25F76",
    accent2: "#E8A0B2",
    bg: "#FDF6F7",
    surface: "#FFFFFF",
    ink: "#2B1B20",
    muted: "#6D555C",
    onAccent: "#FFFFFF",
  },
  {
    id: "lavande",
    name: "Lavande",
    family: "Doux",
    accent: "#7B62C9",
    accent2: "#AE9BE5",
    bg: "#F8F6FD",
    surface: "#FFFFFF",
    ink: "#1E1930",
    muted: "#5B5474",
    onAccent: "#FFFFFF",
  },
  {
    id: "menthe",
    name: "Menthe",
    family: "Doux",
    accent: "#2E9070",
    accent2: "#77C7A8",
    bg: "#F3FAF7",
    surface: "#FFFFFF",
    ink: "#12241D",
    muted: "#4C6459",
    onAccent: "#FFFFFF",
  },
  {
    id: "sable",
    name: "Sable",
    family: "Doux",
    accent: "#A9803F",
    accent2: "#D6B47A",
    bg: "#FCF9F3",
    surface: "#FFFFFF",
    ink: "#26200F",
    muted: "#655B45",
    onAccent: "#FFFFFF",
  },
  {
    id: "ciel",
    name: "Ciel",
    family: "Doux",
    accent: "#3C7FB1",
    accent2: "#84B6DA",
    bg: "#F4F9FC",
    surface: "#FFFFFF",
    ink: "#13212B",
    muted: "#4D6270",
    onAccent: "#FFFFFF",
  },
];

export const PALETTE_FAMILIES = [
  "Chaleureux",
  "Naturel",
  "Élégant",
  "Vif",
  "Doux",
] as const;

export const getPalette = (id: string): Palette =>
  PALETTES.find((p) => p.id === id) ?? PALETTES[5]; // Vert marché par défaut

/* Applique la palette en variables CSS sur un élément.
   Les composants lisent var(--accent) etc., donc un changement
   de palette repeint toute la boutique d'un coup. */
export const paletteVars = (p: Palette): React.CSSProperties =>
  ({
    "--accent": p.accent,
    "--accent-2": p.accent2,
    "--bg": p.bg,
    "--surface": p.surface,
    "--ink": p.ink,
    "--muted": p.muted,
    "--on-accent": p.onAccent,
  }) as React.CSSProperties;
