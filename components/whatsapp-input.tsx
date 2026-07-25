"use client";

import {
  ECOWAS_COUNTRIES,
  findEcowasCountryByDigits,
  getEcowasCountry,
  validateEcowasPhone,
  type EcowasCountry,
} from "@/lib/ecowas";
import { useState } from "react";

const DEFAULT_ISO = "CI"; // marché principal de l'app

/* Sélecteur de pays (CEDEAO) + numéro local, avec validation du nombre
   de chiffres par pays. Produit exactement le même format de chaîne
   qu'avant ("indicatif+numéro", ex. "2250700000000") : aucun changement
   ailleurs (wa.me, configToShop, etc.) n'est nécessaire. */
export function WhatsAppInput({
  value,
  onChange,
  autoFocus,
}: {
  value: string;
  onChange: (digits: string) => void;
  autoFocus?: boolean;
}) {
  const initial = useState<EcowasCountry>(
    () => findEcowasCountryByDigits(value) ?? getEcowasCountry(DEFAULT_ISO)!
  )[0];
  const [countryIso, setCountryIso] = useState(initial.iso);
  const [local, setLocal] = useState(() =>
    value.startsWith(initial.dialCode) ? value.slice(initial.dialCode.length) : value
  );
  const country = getEcowasCountry(countryIso) ?? initial;
  const error = local ? validateEcowasPhone(local, country) : null;

  const commit = (iso: string, loc: string) => {
    const c = getEcowasCountry(iso) ?? initial;
    onChange(c.dialCode + loc);
  };

  return (
    <div>
      <div className="flex items-stretch gap-2">
        {/* .input impose déjà w-full (globals.css) : le contraindre à
            132px sur l'élément lui-même se ferait battre par cette
            règle (même spécificité). On fixe la largeur sur un wrapper
            à la place, pour ne pas dépendre de l'ordre des classes. */}
        <div className="w-[132px] shrink-0">
          <select
            className="input"
            value={countryIso}
            onChange={(e) => {
              setCountryIso(e.target.value);
              commit(e.target.value, local);
            }}
          >
            {ECOWAS_COUNTRIES.map((c) => (
              <option key={c.iso} value={c.iso}>
                {c.flag} +{c.dialCode}
              </option>
            ))}
          </select>
        </div>
        <input
          className="input flex-1"
          type="tel"
          inputMode="numeric"
          autoFocus={autoFocus}
          value={local}
          placeholder="07 00 00 00 00"
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            setLocal(digits);
            commit(countryIso, digits);
          }}
        />
      </div>
      {error && <p className="mt-1.5 text-xs font-semibold text-terra">{error}</p>}
    </div>
  );
}
