# Brancher un agrégateur de paiement

Tout est prêt. Il reste **un fichier à écrire**.

## Ce qui existe déjà

| Fichier | Rôle |
|---|---|
| `lib/payment/index.ts` | Interface commune + fournisseur factice |
| `app/api/checkout/route.ts` | Crée l'intention. **Le montant est fixé côté serveur** — sinon on paierait Premium 1 franc |
| `app/api/webhooks/paiement/route.ts` | Reçoit la confirmation, crédite l'abonnement |
| `app/dashboard/abonnement/page.tsx` | L'écran, déjà branché sur `/api/checkout` |

## Les 3 étapes

**1. Créer `lib/payment/<ton-agregateur>.ts`**

```ts
import { type PaymentProvider, safeCompare } from "./index";
import crypto from "crypto";

export class MonProvider implements PaymentProvider {
  readonly name = "mon-agregateur";

  constructor(private cfg: { apiKey: string; secret: string }) {}

  async createCheckout(input) {
    const res = await fetch("https://api.agregateur.com/v1/payments", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.cfg.apiKey}` },
      body: JSON.stringify({
        amount: PLAN_PRICES[input.plan],   // JAMAIS le montant du client
        phone: input.phone,
        reference: input.idempotencyKey,
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/paiement`,
      }),
    });
    const data = await res.json();
    return { kind: "redirect", url: data.payment_url, reference: data.id };
  }

  verifyWebhook(rawBody, headers) {
    const sig = headers["x-signature"] ?? "";
    const expected = crypto
      .createHmac("sha256", this.cfg.secret)
      .update(rawBody)
      .digest("hex");
    return safeCompare(sig, expected);   // comparaison à temps constant
  }

  parseWebhook(rawBody) {
    const d = JSON.parse(rawBody);
    return {
      reference: d.id,
      idempotencyKey: d.reference,
      status: d.status === "SUCCESS" ? "paid" : "failed",
      amount: d.amount,
      operator: null,
      raw: d,
    };
  }
}
```

**2. Le déclarer dans `getProvider()`** (`lib/payment/index.ts`) — le `switch` est déjà là.

**3. Variables d'environnement**

```
PAYMENT_PROVIDER=mon-agregateur
MON_AGREGATEUR_API_KEY=...
MON_AGREGATEUR_SECRET=...
SUPABASE_SERVICE_ROLE_KEY=...
```

> ⚠️ **Aucune de ces variables ne doit être préfixée `NEXT_PUBLIC_`.** Elles seraient alors visibles dans le navigateur. `SUPABASE_SERVICE_ROLE_KEY` contourne toute la sécurité RLS.

## Les 3 règles non négociables

**1. Vérifier la signature.** Sans elle, n'importe qui POSTe une fausse confirmation et s'abonne gratuitement à Premium. Un agrégateur qui ne signe pas ses webhooks ne doit pas être utilisé.

**2. L'idempotence.** Les agrégateurs Mobile Money **rejouent** les webhooks. `payments.idempotency_key` est UNIQUE en base : un rejeu est détecté et ignoré. Sans ça, un vendeur est crédité plusieurs fois.

**3. Le montant vient du serveur.** `PLAN_PRICES` dans `lib/payment/index.ts`. Jamais du corps de la requête.

## Choisir un agrégateur

Vérifie ces cinq points avant de signer :

1. **Documentation publique** — pas de doc en ligne = fuis
2. **Sandbox** — tester sans argent réel
3. **Webhooks signés** — non négociable (voir ci-dessus)
4. **Couverture de ton pays** — beaucoup ne couvrent que le Sénégal ou le Bénin
5. **Documents exigés** — RCCM, pièce d'identité, RIB. **Compte 1 à 3 semaines**, anticipe.

Candidats connus en Afrique de l'Ouest francophone : KKiaPay, CinetPay, PayDunya, Qosic, Paystack, Flutterwave, Wave Business.

## Tester sans agrégateur

Le fournisseur factice (`MockProvider`) laisse dérouler tout le parcours sans argent. Il **refuse de tourner en production** — c'est voulu.

Pour tester la suite, passe le plan à la main :
```sql
update shops set plan = 'business', status = 'active' where slug = 'ma-boutique';
```

C'est d'ailleurs ce que je te conseille pour tes 10 premiers vendeurs : encaisse à la main, vérifie qu'ils paient, **puis** intègre.
