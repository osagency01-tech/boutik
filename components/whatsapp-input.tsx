"use client";

import { FlagIcon } from "@/components/flag-icon";
import {
  ECOWAS_COUNTRIES,
  findEcowasCountryByDigits,
  getEcowasCountry,
  validateEcowasPhone,
  type EcowasCountry,
} from "@/lib/ecowas";
import { useEffect, useState } from "react";

const DEFAULT_ISO = "CI"; // marché principal de l'app

/* Sélecteur de pays (CEDEAO) + numéro local, avec validation du nombre
   de chiffres par pays. Produit exactement le même format de chaîne
   qu'avant ("indicatif+numéro", ex. "2250700000000") : aucun changement
   ailleurs (wa.me, configToShop, etc.) n'est nécessaire.

   `onChange` reflète TOUJOURS le champ principal tel qu'affiché à
   l'écran, même en attente de confirmation — la version précédente
   retenait silencieusement la valeur tant que la confirmation ne
   correspondait pas, ce qui permettait de créer une boutique avec un
   numéro différent de celui affiché si le vendeur corrigeait le champ
   principal sans retoucher la confirmation. La validité (confirmé ET
   sans erreur) est communiquée séparément via `onValidChange`, à
   l'appelant de décider s'il bloque la suite tant qu'elle est fausse.

   `requireConfirm` ajoute un second champ qui démarre à la MÊME valeur
   que le numéro principal (pas vide) : sans ça, rouvrir les réglages
   d'une boutique déjà configurée afficherait une erreur de
   correspondance permanente alors que rien n'a changé. L'erreur
   n'apparaît que si le vendeur modifie l'un sans l'autre. */
export function WhatsAppInput({
  value,
  onChange,
  autoFocus,
  requireConfirm,
  onValidChange,
}: {
  value: string;
  onChange: (digits: string) => void;
  autoFocus?: boolean;
  requireConfirm?: boolean;
  onValidChange?: (valid: boolean) => void;
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
  const confirmed = !requireConfirm || (confirmLocal.length > 0 && confirmLocal === local);
  const mismatch = requireConfirm && confirmLocal.length > 0 && confirmLocal !== local;

  useEffect(() => {
    onValidChange?.(!error && confirmed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, confirmed]);

  return (
    <div>
      <div className="flex items-stretch gap-2">
        {/* .input impose déjà w-full ET son propre padding (globals.css) :
            une classe utilitaire (pl-9, w-[132px]) posée directement sur
            le select se fait battre par cette règle de même spécificité.
            Le drapeau et la largeur vivent donc sur un wrapper séparé qui
            porte lui-même l'apparence (bordure, fond, arrondi) ; le
            select devient transparent et sans bordure à l'intérieur —
            aucun chevauchement possible entre le drapeau et le texte. */}
        <div className="flex w-[136px] shrink-0 items-center gap-1.5 rounded-xl border border-ink/15 bg-white pl-2.5 pr-1">
          <FlagIcon iso={countryIso} className="h-3.5 w-5 shrink-0" />
          <select
            className="w-full border-0 bg-transparent py-3 pr-1 text-sm outline-none"
            value={countryIso}
            onChange={(e) => {
              setCountryIso(e.target.value);
              const c = getEcowasCountry(e.target.value) ?? initial;
              onChange(c.dialCode + local);
            }}
          >
            {ECOWAS_COUNTRIES.map((c) => (
              <option key={c.iso} value={c.iso}>
                +{c.dialCode}
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
            onChange(country.dialCode + digits);
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
            onChange={(e) => setConfirmLocal(e.target.value.replace(/\D/g, ""))}
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
