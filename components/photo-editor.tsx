"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Contrast,
  Crop,
  Loader2,
  RotateCw,
  Sun,
  Undo2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ *
 * Éditeur de photo produit
 *
 * Le vrai travail d'un vendeur, ce n'est pas de créer sa boutique :
 * c'est de photographier 20 produits correctement. C'est là qu'il
 * abandonne. Cet écran corrige les défauts les plus courants —
 * photo penchée, trop sombre, pas cadrée.
 *
 * Choix assumé : PAS de suppression de fond par IA. Ça exigerait un
 * modèle de ~5 Mo à télécharger, sur un téléphone d'entrée de gamme
 * en 3G, pour un résultat médiocre sur une photo mal éclairée — le
 * cas exact de nos vendeurs. Le détourage viendra via une API quand
 * il y en aura une.
 *
 * Tout tourne en canvas : ~15 Ko, aucun appel réseau.
 * ------------------------------------------------------------------ */

type Adjust = {
  brightness: number; // 100 = neutre
  contrast: number;
  rotate: number;
  zoom: number;
  bg: string | null; // fond uni derrière une image transparente
};

const NEUTRAL: Adjust = { brightness: 100, contrast: 100, rotate: 0, zoom: 1, bg: null };

/* Fonds unis : dépanne quand la photo est prise sur une table
   encombrée. Ne remplace pas un vrai détourage. */
const BACKGROUNDS = [
  { id: null, label: "Original" },
  { id: "#FFFFFF", label: "Blanc" },
  { id: "#F7F8F4", label: "Crème" },
  { id: "#EFEFEF", label: "Gris" },
  { id: "#14231B", label: "Sombre" },
];

const OUT_SIZE = 900;

export default function PhotoEditor({
  file,
  onCancel,
  onDone,
}: {
  file: File;
  onCancel: () => void;
  onDone: (dataUrl: string) => void;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [adj, setAdj] = useState<Adjust>(NEUTRAL);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* Charger l'image une seule fois */
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => setImg(im);
    im.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  /* Rendu : toujours carré. Un catalogue avec des vignettes de
     hauteurs différentes fait immédiatement amateur. */
  const draw = useCallback(
    (canvas: HTMLCanvasElement, size: number) => {
      if (!img) return;
      canvas.width = size;
      canvas.height = size;
      const cx = canvas.getContext("2d");
      if (!cx) return;

      cx.fillStyle = adj.bg ?? "#F7F8F4";
      cx.fillRect(0, 0, size, size);

      cx.save();
      cx.translate(size / 2, size / 2);
      cx.rotate((adj.rotate * Math.PI) / 180);
      cx.filter = `brightness(${adj.brightness}%) contrast(${adj.contrast}%)`;

      /* On couvre le carré : l'image remplit sans déformer. */
      const scale = (Math.max(size / img.width, size / img.height) * adj.zoom);
      const w = img.width * scale;
      const h = img.height * scale;
      cx.drawImage(img, -w / 2, -h / 2, w, h);
      cx.restore();
    },
    [img, adj]
  );

  useEffect(() => {
    if (canvasRef.current) draw(canvasRef.current, 380);
  }, [draw]);

  const apply = async () => {
    if (!img) return;
    setBusy(true);
    /* Export à la taille finale, pas à la taille d'aperçu. */
    const out = document.createElement("canvas");
    draw(out, OUT_SIZE);
    const dataUrl = out.toDataURL("image/jpeg", 0.85);
    setBusy(false);
    onDone(dataUrl);
  };

  const touched =
    adj.brightness !== 100 ||
    adj.contrast !== 100 ||
    adj.rotate !== 0 ||
    adj.zoom !== 1 ||
    adj.bg !== null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/60 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="nice-scroll max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-extrabold">Ajuste ta photo</h2>
          <button
            onClick={onCancel}
            className="rounded-full p-2 text-ink/40 hover:bg-cream"
            aria-label="Annuler"
          >
            <X size={18} />
          </button>
        </div>

        {/* Aperçu */}
        <div className="mt-4 overflow-hidden rounded-2xl bg-cream">
          {img ? (
            <canvas ref={canvasRef} className="block h-auto w-full" />
          ) : (
            <div className="flex aspect-square items-center justify-center">
              <Loader2 className="animate-spin text-ink/25" />
            </div>
          )}
        </div>

        <div className="mt-5 space-y-4">
          {/* Luminosité — le défaut le plus fréquent en intérieur */}
          <Slider
            icon={<Sun size={14} />}
            label="Luminosité"
            value={adj.brightness}
            min={60}
            max={160}
            onChange={(v) => setAdj({ ...adj, brightness: v })}
          />
          <Slider
            icon={<Contrast size={14} />}
            label="Contraste"
            value={adj.contrast}
            min={70}
            max={150}
            onChange={(v) => setAdj({ ...adj, contrast: v })}
          />
          <Slider
            icon={<Crop size={14} />}
            label="Zoom"
            value={Math.round(adj.zoom * 100)}
            min={100}
            max={220}
            onChange={(v) => setAdj({ ...adj, zoom: v / 100 })}
          />

          {/* Fond */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-ink/60">
              Fond
            </p>
            <div className="flex flex-wrap gap-2">
              {BACKGROUNDS.map((b) => (
                <button
                  key={b.label}
                  onClick={() => setAdj({ ...adj, bg: b.id })}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                    adj.bg === b.id
                      ? "border-ink bg-cream"
                      : "border-ink/10 hover:border-ink/40"
                  }`}
                >
                  {b.id && (
                    <span
                      className="h-3 w-3 rounded-sm ring-1 ring-ink/10"
                      style={{ backgroundColor: b.id }}
                    />
                  )}
                  {b.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-ink/40">
              Le fond ne remplace pas la photo : il n&apos;apparaît qu&apos;autour, si tu
              zoomes ou tournes l&apos;image.
            </p>
          </div>

          {/* Actions rapides */}
          <div className="flex gap-2">
            <button
              onClick={() => setAdj({ ...adj, rotate: (adj.rotate + 90) % 360 })}
              className="btn-ghost btn-sm flex-1"
            >
              <RotateCw size={14} /> Tourner
            </button>
            <button
              onClick={() => setAdj(NEUTRAL)}
              disabled={!touched}
              className="btn-ghost btn-sm flex-1 disabled:opacity-35"
            >
              <Undo2 size={14} /> Réinitialiser
            </button>
          </div>
        </div>

        {/* Conseil : la meilleure retouche reste une bonne prise de vue */}
        <div className="mt-4 rounded-xl bg-cream p-3 text-[11px] leading-relaxed text-ink/55">
          <strong>Astuce :</strong> une photo prise près d&apos;une fenêtre, sur un mur ou un
          tissu uni, vend beaucoup mieux que n&apos;importe quelle retouche.
        </div>

        <div className="mt-5 flex gap-3">
          <button onClick={onCancel} className="btn-ghost btn-md flex-1">
            Annuler
          </button>
          <button
            onClick={apply}
            disabled={!img || busy}
            className="btn-primary btn-md flex-1 disabled:opacity-40"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Utiliser
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Slider({
  icon,
  label,
  value,
  min,
  max,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-bold text-ink/60">
          {icon} {label}
        </span>
        <span className="text-[11px] font-semibold text-ink/40">{value}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink/10 accent-primary"
      />
    </div>
  );
}
