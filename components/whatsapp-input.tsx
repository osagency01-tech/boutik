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
   ailleurs (wa.me, configToShop, etc.) n'est nécessaire.

   `requireConfirm` ajoute un second champ "confirme ton numéro". Il
   démarre à la MÊME valeur que le numéro principal (pas vide) : sans
   ça, rouvrir les réglages d'une boutique déjà configurée afficherait
   une erreur de correspondance permanente alors que rien n'a changé.
   L'erreur n'apparaît que si le vendeur modifie l'un sans l'autre —
   exactement le cas qu'on veut attraper (faute de frappe). */
export function WhatsAppInput({
  value,
  onChange,
  autoFocus,
  requireConfirm,
}: {
  value: string;
  onChange: (digits: string) => void;
  autoFocus?: boolean;
  requireConfirm?: boolean;
}) {
  const initial = useState<EcowasCountry>(
    () => findEcowasCountryByDigits(value) ?? getEcowasCountry(DEFAULT_ISO)!
  )[0];
  const initialLocal = () =>
    value.startsWith(initial.dialCode) ? value.slice(initial.dialCode.length) : value;

  const [countryIso, setCountryIso] = useState(initial.iso);
  const [local, setLocal] = useState(initialLocal);
  const [confirmLocal, setConfirmLocal] = useState(initialLocal);
  const country = getEcowasCountry(countryIso) ?? initial;
  const error = local ? validateEcowasPhone(local, country) : null;
  const mismatch = requireConfirm && confirmLocal.length > 0 && confirmLocal !== local;

  const commit = (iso: string, loc: string, confirmLoc: string) => {
    if (requireConfirm && loc !== confirmLoc) return; // pas confirmé : on ne propage pas encore
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
              commit(e.target.value, local, confirmLocal);
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
            commit(countryIso, digits, confirmLocal);
          }}
        />
      </div>
      {error && <p className="mt-1.5 text-xs font-semibold text-terra">{error}</p>}

      {requireConfirm && (
        <div className="mt-3">
          <label className="mb-1.5 block text-sm font-bold">Confirme ton numéro WhatsApp</label>
          <input
            className="input"
            type="tel"
            inputMode="numeric"
            value={confirmLocal}
            placeholder="07 00 00 00 00"
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "");
              setConfirmLocal(digits);
              commit(countryIso, local, digits);
            }}
          />
          {mismatch && (
            <p className="mt-1.5 text-xs font-semibold text-terra">
              Les numéros ne correspondent pas.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
