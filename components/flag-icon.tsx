/* ==================================================================== *
 *  Drapeaux — SVG, pas emoji
 *
 *  Les drapeaux emoji (🇨🇮, 🇧🇯...) ne s'affichent pas sur Windows : le
 *  système ne fournit pas de police couleur pour les indicateurs
 *  régionaux et retombe sur du texte brut ("CI") ou un rectangle vide,
 *  aussi bien dans un <option> que dans le texte normal. Un SVG inline
 *  s'affiche pareil partout, sans dépendre d'une police installée.
 *
 *  Dessins simplifiés (bandes de couleur, étoile unique) : à la taille
 *  d'un sélecteur de pays, le détail d'un blason ne serait de toute
 *  façon pas lisible — la reconnaissance vient des couleurs et de la
 *  disposition, pas de l'exactitude héraldique.
 * ==================================================================== */

function Star({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  const points = Array.from({ length: 10 }, (_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const radius = i % 2 === 0 ? r : r * 0.4;
    return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
  }).join(" ");
  return <polygon points={points} fill={fill} />;
}

const FLAGS: Record<string, (key: string) => React.ReactNode> = {
  CI: () => (
    <>
      <rect width="10" height="20" fill="#F77F00" />
      <rect x="10" width="10" height="20" fill="#fff" />
      <rect x="20" width="10" height="20" fill="#009E60" />
    </>
  ),
  BJ: () => (
    <>
      <rect width="12" height="20" fill="#008751" />
      <rect x="12" width="18" height="10" fill="#FCD116" />
      <rect x="12" y="10" width="18" height="10" fill="#E8112D" />
    </>
  ),
  BF: () => (
    <>
      <rect width="30" height="10" fill="#EF2B2D" />
      <rect y="10" width="30" height="10" fill="#009E49" />
      <Star cx={15} cy={10} r={4} fill="#FCD116" />
    </>
  ),
  CV: () => (
    <>
      <rect width="30" height="20" fill="#003893" />
      <rect y="11.5" width="30" height="1.4" fill="#fff" />
      <rect y="12.9" width="30" height="1.4" fill="#CF2027" />
      <rect y="14.3" width="30" height="1.4" fill="#fff" />
      {Array.from({ length: 10 }, (_, i) => (
        <Star key={i} cx={9 + (i % 5) * 2.4} cy={i < 5 ? 6.5 : 9} r={0.9} fill="#F7D116" />
      ))}
    </>
  ),
  GM: () => (
    <>
      <rect width="30" height="20" fill="#CE1126" />
      <rect y="6.5" width="30" height="1.4" fill="#fff" />
      <rect y="7.9" width="30" height="4.2" fill="#0C1C8C" />
      <rect y="12.1" width="30" height="1.4" fill="#fff" />
      <rect y="13.5" width="30" height="6.5" fill="#3A7728" />
    </>
  ),
  GH: () => (
    <>
      <rect width="30" height="6.67" fill="#CE1126" />
      <rect y="6.67" width="30" height="6.66" fill="#FCD116" />
      <rect y="13.33" width="30" height="6.67" fill="#006B3F" />
      <Star cx={15} cy={10} r={3.2} fill="#000" />
    </>
  ),
  GN: () => (
    <>
      <rect width="10" height="20" fill="#CE1126" />
      <rect x="10" width="10" height="20" fill="#FCD116" />
      <rect x="20" width="10" height="20" fill="#009460" />
    </>
  ),
  GW: () => (
    <>
      <rect x="10" width="20" height="10" fill="#FCD116" />
      <rect x="10" y="10" width="20" height="10" fill="#009E49" />
      <rect width="10" height="20" fill="#CE1126" />
      <Star cx={5} cy={10} r={3} fill="#000" />
    </>
  ),
  LR: () => (
    <>
      <rect width="30" height="20" fill="#fff" />
      {[0, 2, 4, 6, 8, 10].map((y) => (
        <rect key={y} y={y} width="30" height="1.54" fill="#BF0A30" />
      ))}
      <rect width="13" height="10.8" fill="#002868" />
      <Star cx={6.5} cy={5.4} r={3.2} fill="#fff" />
    </>
  ),
  ML: () => (
    <>
      <rect width="10" height="20" fill="#14B53A" />
      <rect x="10" width="10" height="20" fill="#FCD116" />
      <rect x="20" width="10" height="20" fill="#CE1126" />
    </>
  ),
  NE: () => (
    <>
      <rect width="30" height="6.67" fill="#E05206" />
      <rect y="6.67" width="30" height="6.66" fill="#fff" />
      <rect y="13.33" width="30" height="6.67" fill="#0DB02B" />
      <circle cx={15} cy={10} r={2.6} fill="#E05206" />
    </>
  ),
  NG: () => (
    <>
      <rect width="10" height="20" fill="#008751" />
      <rect x="10" width="10" height="20" fill="#fff" />
      <rect x="20" width="10" height="20" fill="#008751" />
    </>
  ),
  SN: () => (
    <>
      <rect width="10" height="20" fill="#00853F" />
      <rect x="10" width="10" height="20" fill="#FDEF42" />
      <rect x="20" width="10" height="20" fill="#E31B23" />
      <Star cx={15} cy={10} r={3} fill="#00853F" />
    </>
  ),
  SL: () => (
    <>
      <rect width="30" height="6.67" fill="#1EB53A" />
      <rect y="6.67" width="30" height="6.66" fill="#fff" />
      <rect y="13.33" width="30" height="6.67" fill="#0072C6" />
    </>
  ),
  TG: () => (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} y={i * 4} width="30" height="4" fill={i % 2 === 0 ? "#006A4E" : "#FFCE00"} />
      ))}
      <rect width="12" height="12" fill="#D21034" />
      <Star cx={6} cy={6} r={3} fill="#fff" />
    </>
  ),
  CM: () => (
    <>
      <rect width="10" height="20" fill="#007A5E" />
      <rect x="10" width="10" height="20" fill="#CE1126" />
      <rect x="20" width="10" height="20" fill="#FCD116" />
      <Star cx={15} cy={10} r={3} fill="#FCD116" />
    </>
  ),
};

/** Drapeau d'un pays, en SVG inline (rendu identique sur toutes plateformes). */
export function FlagIcon({ iso, className = "h-3.5 w-5" }: { iso: string; className?: string }) {
  const render = FLAGS[iso];
  if (!render) return <span className={`inline-block rounded-sm bg-ink/10 ${className}`} />;
  return (
    <svg
      viewBox="0 0 30 20"
      className={`inline-block shrink-0 overflow-hidden rounded-sm align-middle ${className}`}
      aria-hidden="true"
    >
      {render(iso)}
    </svg>
  );
}
