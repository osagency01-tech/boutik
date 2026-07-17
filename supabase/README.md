# Base de données — Supabase

Schéma complet, testé sur PostgreSQL 16. **L'isolation multi-tenant est intégrée dès la conception**, pas ajoutée après.

## Mise en route

```bash
supabase init
supabase link --project-ref <ton-projet>
supabase db push          # applique les 3 migrations dans l'ordre
```

Ou, en collant dans le SQL Editor de Supabase, **dans cet ordre** :

1. `migrations/001_schema.sql` — types, tables, index, triggers `updated_at`
2. `migrations/002_rls.sql` — policies RLS, garde-fous métier
3. `migrations/003_storage_lifecycle.sql` — buckets, cycle de vie, vue publique
4. `migrations/004_messages_admin.sql` — messagerie interne, back-office
5. `migrations/005_admin_analytics.sql` — MRR, entonnoir, santé, croissance

## Vérifier que l'isolation tient

```bash
psql <connection-string> -f tests/isolation_test.sql
```

19 assertions. **Un seul `ECHEC` = ne pas déployer.** À rejouer après toute modification du schéma ou des policies.

Le test tourne dans une transaction annulée à la fin : il ne laisse aucune donnée.

## Le principe : la base refuse, pas le code

RLS est actif sur **les 14 tables**, sans exception (le test le vérifie). Si une requête applicative oublie `where shop_id = ...`, Postgres refuse quand même.

C'est la seule protection qui survit à un refactor : un développeur pressé peut oublier un filtre dans le code, il ne peut pas oublier une policy.

**Trois publics :**

| Rôle | Accès |
|---|---|
| `anon` | Vitrine publique uniquement. Peut **créer** une commande, ne peut **jamais en lire une**. |
| `authenticated` | Uniquement les boutiques dont il est propriétaire ou membre. |
| `service_role` | Contourne RLS. Réservé aux webhooks et crons. **Ne jamais exposer cette clé côté client.** |

## Statistiques d'administration

Sept vues, toutes filtrées par `auth_is_admin()` :

| Vue | Répond à |
|---|---|
| `admin_mrr` | Est-ce que ça rapporte ? (MRR, ARPU) |
| `admin_funnel` | Où perd-on les vendeurs ? |
| `admin_health` | Qui va partir ? (impayés, sans vente, boutiques vides) |
| `admin_growth` | Croissance sur 12 mois |
| `admin_top_shops` | Qui porte la plateforme |
| `admin_orders_daily` | Activité sur 30 jours |
| `admin_templates` | Quels modèles sont choisis |

> **Piège corrigé :** une vue d'agrégat (`count`/`sum` sans `GROUP BY`) renvoie **toujours** une ligne, même quand le `WHERE` exclut tout — remplie de zéros. Les valeurs ne fuitaient pas, mais l'existence de la ligne était trompeuse, et un futur ajout de colonne non agrégée aurait fuité pour de vrai. Corrigé par `group by auth_is_admin()` : aucune ligne n'est renvoyée à un non-admin. Vérifié sur PostgreSQL 16.

## Décisions à connaître

**Le client n'a pas de compte** (§5.1 du CDC). Il crée une commande sans être authentifié. Conséquence : il n'existe **aucune policy SELECT sur `orders` pour `anon`**. Sinon n'importe qui listerait les coordonnées de tous les clients de toutes les boutiques. La page de confirmation affiche ce que le client vient de saisir, elle ne relit rien.

**Le vendeur ne fixe ni son plan ni son statut.** Un trigger (`guard_shop_privileges`) le bloque. Sans ça, un `UPDATE` direct depuis le client débloquerait Premium gratuitement — les policies RLS seules ne suffisent pas, car le vendeur a bien le droit de modifier sa boutique, juste pas ces colonnes-là.

**Les quotas sont appliqués en base** (`guard_product_quota`), pas seulement dans l'interface. Le front affiche la barre de quota ; la base la fait respecter même sur un appel API direct.

**Les commandes sont figées.** `order_items` copie `product_name` et `unit_price` au moment de la commande. Si le vendeur change son prix demain, la commande d'hier reste juste. Si le produit est supprimé, la commande reste lisible (`on delete set null`).

**`shop_id` est dénormalisé** sur `order_items` et `product_images`. C'est volontaire : ça permet une policy RLS directe, sans sous-requête coûteuse sur la table parente à chaque ligne.

**Le stock bouge au paiement, pas à la commande** (§9 du CDC). Le paiement se fait hors plateforme ; une commande non payée ne doit pas bloquer le stock. Le drapeau `stock_applied` empêche la double décrémentation sur un cycle `payee → annulee → payee`.

**Les images vont dans Storage, pas en base.** Le front utilise aujourd'hui des dataURL en `localStorage` — c'est bon pour une démo, ça sature au 20ᵉ produit. Convention de chemin : `<shop_id>/<fichier>`. C'est ce premier segment que la policy compare pour empêcher un vendeur de déposer dans le dossier d'un autre.

## Cycle de vie (§3 du CDC)

Trois fonctions à brancher sur un cron quotidien (pg_cron ou Edge Function) :

| Fonction | Rôle |
|---|---|
| `expire_grace_periods()` | J+7 après impayé → boutique dépubliée, purge programmée à J+90 |
| `purge_expired_shops()` | J+90 → produits supprimés, commandes anonymisées |
| `purge_old_orders()` | 12 mois → anonymisation RGPD des données clients |

Les commandes ne sont jamais supprimées, seulement anonymisées : le vendeur peut revenir, et l'historique comptable est conservé.

## Reste à brancher

1. **Auth OTP** — Supabase Auth gère l'envoi ; **penser au rate limiting** (sinon on brute-force un code à 6 chiffres, et on vide le crédit SMS).
2. **Webhook de paiement** — écrit dans `payments` en `service_role`. `idempotency_key` est unique : un webhook rejoué ne crée pas de doublon. **Vérifier la signature du webhook**, sinon on forge une confirmation de paiement.
3. **Agrégateur Mobile Money** — colonnes `provider` / `provider_ref` déjà prévues, à remplir le moment venu.
4. **Migration du front** — remplacer `localStorage` par le client Supabase. Le contrat de données correspond déjà (`ShopConfig` ↔ `shops`, `Product` ↔ `products`).

## Correspondance front ↔ base

| Front (`lib/store.tsx`) | Base |
|---|---|
| `ShopConfig` | `shops` + `delivery_zones` |
| `Product` | `products` + `product_images` |
| `Order` | `orders` + `order_items` + `order_events` |
| `config.plan` | `shops.plan` — **piloté par `subscriptions`, jamais par le client** |
| `product.hidden` | `products.hidden` — filtré par la policy, pas seulement par l'UI |
