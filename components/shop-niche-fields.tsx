"use client";

import { FlagIcon } from "@/components/flag-icon";
import { CATEGORIES } from "@/lib/categories";
import { citiesFor } from "@/lib/cities";
import { ECOWAS_COUNTRIES, getEcowasCountry } from "@/lib/ecowas";
import { useEffect, useState } from "react";

const DEFAULT_ISO = "CI"; // marché principal de l'app
const SEP = " — ";

/* Le tagline affiché est, par convention (voir lib/demo-shops.ts),
   "Catégorie — Ville". On essaie de le décomposer pour pré-remplir les
   selects (utile pour une boutique déjà réglée, dans le dashboard) ;
   un ancien texte libre qui ne correspond à rien renvoie simplement
   null, et on repart d'un choix par défaut. */
function parseTagline(tagline: string) {
  const idx = tagline.indexOf(SEP);
  if (idx < 0) return null;
  const catPart = tagline.slice(0, idx).trim();
  const cityPart = tagline.slice(idx + SEP.length).trim();
  const category = CATEGORIES.find((c) => c.label === catPart);
  if (!category) return null;
  for (const country of ECOWAS_COUNTRIES) {
    if (citiesFor(country.iso).includes(cityPart)) {
      return { categoryValue: category.value, countryIso: country.iso, city: cityPart };
    }
  }
  return null;
}

function composeTagline(categoryValue: string, city: string) {
  const label = CATEGORIES.find((c) => c.value === categoryValue)?.label ?? CATEGORIES[0].label;
  return `${label}${SEP}${city}`;
}

/* Catégorie + pays + ville, composés en un seul "tagline" — remplace
   le champ texte libre qui mélangeait les deux et n'était jamais
   validé. Utilisé dans app/creer/page.tsx (Step1) et
   app/dashboard/boutique/page.tsx (IdentiteTab). */
export function ShopNicheFields({
  tagline,
  onChange,
}: {
  tagline: string;
  onChange: (tagline: string) => void;
}) {
  const initial =
    parseTagline(tagline) ??
    (() => {
      const country = getEcowasCountry(DEFAULT_ISO)!;
      return {
        categoryValue: CATEGORIES[0].value,
        countryIso: country.iso,
        city: citiesFor(country.iso)[0],
      };
    })();

  const [categoryValue, setCategoryValue] = useState(initial.categoryValue);
  const [countryIso, setCountryIso] = useState(initial.countryIso);
  const [city, setCity] = useState(initial.city);

  /* Un tagline vide (nouvelle boutique) ou en texte libre ancien ne
     correspond à aucune combinaison : on en compose un par défaut dès
     le montage pour qu'il ne reste jamais vide (le wizard bloque la
     suite tant que tagline est vide). */
  useEffect(() => {
    if (!parseTagline(tagline)) onChange(composeTagline(categoryValue, city));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cities = citiesFor(countryIso);

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-bold">Que vends-tu ?</label>
        <select
          className="input"
          value={categoryValue}
          onChange={(e) => {
            setCategoryValue(e.target.value);
            onChange(composeTagline(e.target.value, city));
          }}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-bold">Pays</label>
          <div className="relative">
            <FlagIcon
              iso={countryIso}
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-5 -translate-y-1/2"
            />
            <select
              className="input pl-9"
              value={countryIso}
              onChange={(e) => {
                const iso = e.target.value;
                const firstCity = citiesFor(iso)[0] ?? "";
                setCountryIso(iso);
                setCity(firstCity);
                onChange(composeTagline(categoryValue, firstCity));
              }}
            >
              {ECOWAS_COUNTRIES.map((c) => (
                <option key={c.iso} value={c.iso}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-bold">Ville</label>
          <select
            className="input"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              onChange(composeTagline(categoryValue, e.target.value));
            }}
          >
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
