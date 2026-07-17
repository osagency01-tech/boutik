"use client";

import { getShopIcon } from "@/components/icons";

/* Miniature d'un template : une vraie boutique en réduction.
   On garde les éléments réels (en-tête, bannière, grille produits)
   pour que le vendeur reconnaisse ce qu'il va obtenir. */

type Props = {
  id: string;
  accent: string;
  logoIcon?: string;
  logo?: string;
};

const ICONS = ["shirt", "bag", "sparkles", "footprints", "leaf", "gem", "home", "watch", "cake"];

function Head({ accent, logoIcon, logo, dark }: Props & { dark?: boolean }) {
  const Icon = getShopIcon(logoIcon ?? "store");
  return (
    <div className={`flex items-center gap-[3px] px-[5px] py-[4px] ${dark ? "bg-[#1b2b22]" : "bg-white"}`}>
      {logo ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={logo} alt="" className="h-[7px] w-[7px] rounded-full object-cover" />
      ) : (
        <span
          className="flex h-[7px] w-[7px] items-center justify-center rounded-full"
          style={{ backgroundColor: accent + "26" }}
        >
          <Icon size={4} style={{ color: accent }} strokeWidth={2.5} />
        </span>
      )}
      <span className={`h-[3px] w-[22px] rounded-full ${dark ? "bg-white/25" : "bg-ink/20"}`} />
      <span className={`ml-auto h-[4px] w-[4px] rounded-full ${dark ? "bg-white/20" : "bg-ink/10"}`} />
    </div>
  );
}

function Tile({ accent, h = 14, icon }: { accent: string; h?: number; icon?: string }) {
  const Icon = getShopIcon(icon ?? "package");
  return (
    <div className="overflow-hidden rounded-[2px] bg-white">
      <div className="flex items-center justify-center" style={{ height: h, backgroundColor: accent + "12" }}>
        <Icon size={Math.max(4, h * 0.42)} style={{ color: accent, opacity: 0.5 }} strokeWidth={1.5} />
      </div>
      <div className="space-y-[1.5px] p-[2px]">
        <div className="h-[2px] w-3/4 rounded-full bg-ink/15" />
        <div className="h-[2px] w-1/3 rounded-full" style={{ backgroundColor: accent }} />
      </div>
    </div>
  );
}

function Glyph({ name, size, color, op = 0.5 }: { name: string; size: number; color: string; op?: number }) {
  const Icon = getShopIcon(name);
  return <Icon size={size} style={{ color, opacity: op }} strokeWidth={1.5} />;
}

export default function TemplateSketch(props: Props) {
  const { id, accent } = props;

  return (
    <div className="aspect-[4/3] w-full overflow-hidden rounded-md bg-cream ring-1 ring-ink/5">
      {id === "classique" && (
        <>
          <Head {...props} />
          <div className="p-[5px]">
            <div
              className="flex flex-col justify-center rounded-[3px] px-[4px]"
              style={{ height: 22, background: `linear-gradient(135deg, ${accent}, ${accent}B0)` }}
            >
              <div className="h-[2px] w-1/4 rounded-full bg-white/50" />
              <div className="mt-[2px] h-[3px] w-2/3 rounded-full bg-white/90" />
            </div>
            <div className="mt-[4px] grid grid-cols-4 gap-[3px]">
              {ICONS.slice(0, 4).map((ic, i) => (
                <Tile key={i} accent={accent} icon={ic} h={13} />
              ))}
            </div>
          </div>
        </>
      )}

      {id === "catalogue" && (
        <>
          <Head {...props} />
          <div className="p-[4px]">
            <div className="flex gap-[2px]">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="h-[4px] flex-1 rounded-full"
                  style={{ backgroundColor: i === 0 ? accent : "#14231B14" }}
                />
              ))}
            </div>
            <div className="mt-[3px] grid grid-cols-5 gap-[2px]">
              {Array.from({ length: 15 }).map((_, i) => (
                <Tile key={i} accent={accent} icon={ICONS[i % ICONS.length]} h={7} />
              ))}
            </div>
          </div>
        </>
      )}

      {id === "vitrine" && (
        <>
          <Head {...props} />
          <div className="p-[5px]">
            <div className="mx-auto h-[2px] w-1/4 rounded-full" style={{ backgroundColor: accent }} />
            <div className="mx-auto mt-[3px] h-[3px] w-2/3 rounded-full bg-ink/25" />
            <div className="mt-[4px]">
              <Tile accent={accent} icon="shirt" h={24} />
            </div>
            <div className="mt-[3px] grid grid-cols-3 gap-[3px]">
              {ICONS.slice(1, 4).map((ic, i) => (
                <Tile key={i} accent={accent} icon={ic} h={11} />
              ))}
            </div>
          </div>
        </>
      )}

      {id === "fashion" && (
        <>
          <Head {...props} />
          <div className="p-[4px]">
            <div className="relative overflow-hidden rounded-[3px]">
              <div className="flex items-center justify-center" style={{ height: 30, backgroundColor: accent + "1A" }}>
                <Glyph name="shirt" size={13} color={accent} op={0.45} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-[3px]">
                <div className="h-[2px] w-1/3 rounded-full bg-white/60" />
                <div className="mt-[2px] h-[4px] w-3/4 rounded-full bg-white" />
              </div>
            </div>
            <div className="mt-[3px] h-[1px] w-full bg-ink" />
            <div className="mt-[3px] flex gap-[3px] overflow-hidden">
              {ICONS.slice(0, 5).map((ic, i) => (
                <div key={i} className="w-[15px] shrink-0">
                  <Tile accent={accent} icon={ic} h={13} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {id === "beauty" && (
        <>
          <Head {...props} />
          <div className="p-[5px]">
            <div
              className="flex flex-col items-center justify-center rounded-[6px]"
              style={{ height: 22, backgroundColor: accent + "22" }}
            >
              <div className="h-[2px] w-1/5 rounded-full" style={{ backgroundColor: accent }} />
              <div className="mt-[2px] h-[3px] w-1/2 rounded-full bg-ink/25" />
            </div>
            <div className="mt-[4px] space-y-[4px]">
              {[0, 1].map((i) => (
                <div key={i} className={`flex items-center gap-[3px] ${i % 2 ? "flex-row-reverse" : ""}`}>
                  <div
                    className="flex h-[13px] w-[13px] shrink-0 items-center justify-center rounded-[5px]"
                    style={{ backgroundColor: accent + "18" }}
                  >
                    <Glyph name={i ? "leaf" : "sparkles"} size={6} color={accent} op={0.6} />
                  </div>
                  <div className="flex-1 space-y-[2px]">
                    <div className={`h-[2px] w-2/3 rounded-full bg-ink/18 ${i % 2 ? "ml-auto" : ""}`} />
                    <div
                      className={`h-[2px] w-1/4 rounded-full ${i % 2 ? "ml-auto" : ""}`}
                      style={{ backgroundColor: accent }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {id === "food" && (
        <>
          <Head {...props} />
          <div className="p-[4px]">
            <div
              className="flex flex-col items-center justify-center rounded-[3px]"
              style={{ height: 16, background: `linear-gradient(135deg, ${accent}, ${accent}C0)` }}
            >
              <div className="h-[2px] w-1/5 rounded-full bg-white/50" />
              <div className="mt-[2px] h-[3px] w-1/2 rounded-full bg-white/90" />
            </div>
            <div className="mt-[3px] space-y-[3px]">
              {["utensils", "cake", "coffee", "wine"].map((ic, i) => (
                <div key={i} className="flex items-center gap-[3px] rounded-[2px] bg-white p-[2px]">
                  <div
                    className="flex h-[8px] w-[8px] shrink-0 items-center justify-center rounded-[2px]"
                    style={{ backgroundColor: accent + "14" }}
                  >
                    <Glyph name={ic} size={4.5} color={accent} op={0.6} />
                  </div>
                  <div className="h-[2px] flex-1 rounded-full bg-ink/15" />
                  <div className="h-[2px] w-[6px] rounded-full" style={{ backgroundColor: accent }} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {id === "luxury" && (
        <div className="h-full bg-[#14231B]">
          <Head {...props} dark />
          <div className="px-[6px] py-[5px]">
            <div className="mx-auto h-[2px] w-1/4 rounded-full bg-white/25" />
            <div className="mx-auto mt-[3px] h-[3px] w-3/5 rounded-full bg-white/70" />
            <div className="mx-auto mt-[3px] h-[1px] w-[8px]" style={{ backgroundColor: accent }} />
            <div className="mt-[5px] flex items-center justify-center" style={{ height: 26 }}>
              <Glyph name="gem" size={12} color="#ffffff" op={0.2} />
            </div>
            <div className="mx-auto mt-[4px] h-[2px] w-1/3 rounded-full bg-white/30" />
          </div>
        </div>
      )}

      {id === "modern" && (
        <>
          <Head {...props} />
          <div className="p-[4px]">
            <div className="grid grid-cols-3 grid-rows-2 gap-[3px]" style={{ height: 30 }}>
              <div
                className="col-span-2 row-span-2 flex flex-col justify-center rounded-[3px] px-[4px]"
                style={{ background: `linear-gradient(135deg, ${accent}, ${accent}AA)` }}
              >
                <div className="h-[2px] w-1/3 rounded-full bg-white/50" />
                <div className="mt-[2px] h-[4px] w-4/5 rounded-full bg-white/90" />
              </div>
              <div
                className="flex items-center justify-center rounded-[3px]"
                style={{ backgroundColor: accent + "18" }}
              >
                <Glyph name="bag" size={6} color={accent} op={0.55} />
              </div>
              <div className="flex items-center justify-center rounded-[3px] bg-ink">
                <div className="h-[2px] w-1/2 rounded-full bg-white/40" />
              </div>
            </div>
            <div className="mt-[3px] grid grid-cols-4 gap-[2px]">
              {ICONS.slice(0, 4).map((ic, i) => (
                <Tile key={i} accent={accent} icon={ic} h={9} />
              ))}
            </div>
          </div>
        </>
      )}

      {id === "artisan" && (
        <>
          <Head {...props} />
          <div className="p-[5px]">
            <div className="mx-auto h-[2px] w-1/5 rounded-full" style={{ backgroundColor: accent }} />
            <div className="mx-auto mt-[2px] h-[3px] w-1/2 rounded-full bg-ink/25" />
            <div className="mt-[5px] space-y-[5px]">
              {[0, 1].map((i) => (
                <div key={i} className={`flex items-center gap-[4px] ${i % 2 ? "flex-row-reverse" : ""}`}>
                  <div className="relative shrink-0">
                    <div
                      className="flex h-[16px] w-[18px] items-center justify-center rounded-[2px]"
                      style={{ backgroundColor: accent + "14" }}
                    >
                      <Glyph name={i ? "home" : "hammer"} size={7} color={accent} op={0.55} />
                    </div>
                    <span
                      className="absolute -left-[2px] -top-[2px] h-[6px] w-[6px] rounded-full"
                      style={{ backgroundColor: accent }}
                    />
                  </div>
                  <div className="flex-1 space-y-[2px]">
                    <div className={`h-[2px] w-2/3 rounded-full bg-ink/18 ${i % 2 ? "ml-auto" : ""}`} />
                    <div className={`h-[2px] w-1/2 rounded-full bg-ink/10 ${i % 2 ? "ml-auto" : ""}`} />
                    <div
                      className={`h-[2px] w-1/4 rounded-full ${i % 2 ? "ml-auto" : ""}`}
                      style={{ backgroundColor: accent }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
