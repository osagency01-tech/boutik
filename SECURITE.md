# Audit de sécurité — Boutik

Dernière vérification : build actuel, testé sur navigateur réel et PostgreSQL 16.

## Le principe

Trois barrières, dans cet ordre d'importance :

1. **RLS en base** (`supabase/migrations/002_rls.sql`) — la seule protection qu'un développeur ne peut pas oublier dans un refactor. Si une requête oublie `where shop_id = ...`, Postgres refuse.
2. **En-têtes HTTP** (`next.config.mjs`) — appliqués avant que le code s'exécute.
3. **Validation applicative** (`lib/security.ts`) — confort et propreté des données.

> **La couche 3 tourne dans le navigateur : un attaquant peut la contourner.** Elle ne remplace jamais les deux premières. C'est écrit en tête du fichier.

## Ce qui a été vérifié

### Isolation multi-tenant — 19/19
`supabase/tests/isolation_test.sql`, rejoué sur PostgreSQL 16 :
- Un vendeur ne lit **aucune** commande d'un autre → 0
- Ne voit pas les produits masqués d'un autre → 0
- Ne peut ni modifier sa boutique, ni supprimer ses produits → 0 ligne affectée
- Un visiteur anonyme ne lit **aucune** commande → 0
- **Aucune table sans RLS** → 0

### Messagerie & admin — 11/11
`004_messages_admin.sql` :
- Purge : 30 j si non lu → 7 j après lecture
- Anti-flood : 3 messages/h/boutique, appliqué en base
- Un vendeur ne peut pas appeler `admin_set_shop_status` → bloqué
- Un vendeur ne voit pas `admin_stats` → 0 ligne

### Élévation de privilèges — bloquée par triggers
RLS seul ne suffisait pas : un vendeur a le droit de modifier sa boutique, mais pas ces colonnes-là.
- Se donner **Premium** gratuitement → `guard_shop_privileges`
- Se déclarer **admin** → `guard_is_admin`
- Contourner le **quota produits** par appel API → `guard_product_quota`
- Changer son **slug** après publication → bloqué

### Validation des entrées — 11/11 (testé au navigateur)
| Attaque | Résultat |
|---|---|
| `<script>alert(1)</script>` en slug | `script-alert-1-script` |
| `evil.attaquant.com` en slug | `evil-attaquant-com` (point retiré → pas de sous-domaine imbriqué) |
| `../../etc/passwd` | `etc-passwd` |
| `javascript:alert(document.cookie)` | rejeté |
| `data:text/html,<script>` | rejeté |
| Montant négatif / NaN / Infinity | → 0 |
| `225070000&text=PIRATE` dans wa.me | `225070000` |

### En-têtes HTTP — vérifiés en réponse réelle
`Content-Security-Policy` · `Strict-Transport-Security` (2 ans, sous-domaines) · `X-Content-Type-Options: nosniff` · `X-Frame-Options: DENY` · `Referrer-Policy` · `Permissions-Policy` · `Cross-Origin-Opener-Policy`

`X-Powered-By` masqué : autant ne pas annoncer aux robots quelle version de Next tester.

### CSP — testée en conditions réelles
- Injection d'un `<script src="https://evil...">` → **bloqué**
- `fetch()` vers un domaine tiers → **bloqué**

C'est le filet de sécurité : même si un script malveillant s'exécutait, il ne pourrait pas exfiltrer les données.

### Chiffrement local — AES-GCM 256
`secureSet` / `secureGet` dans `lib/security.ts`. Vérifié : les données sont illisibles dans `localStorage`, le déchiffrement fonctionne.

> **Limite assumée :** la clé vit dans la même page. Ça protège contre un script tiers ou une extension qui lirait `localStorage` en clair. **Ça ne protège pas** contre quelqu'un qui a la main sur l'appareil. Les vraies données sensibles (commandes, clients) restent en base, protégées par RLS.

### Fichiers
Type MIME et taille vérifiés avant traitement, magic bytes disponibles via `isRealImage()`. Supabase Storage revérifie côté serveur (`allowed_mime_types`) : un `.php` renommé `.jpg` est rejeté deux fois.

## Ce qui reste à faire

| Point | Pourquoi c'est important |
|---|---|
| **Rate limit OTP** | Sans ça, on brute-force un code à 6 chiffres. Supabase → *Auth → Rate Limits* |
| **Signature des webhooks** | Sinon on forge une confirmation de paiement et on s'abonne gratuitement |
| **`service_role` côté serveur uniquement** | Ne JAMAIS la mettre dans une variable `NEXT_PUBLIC_*` |
| **Modération humaine** | `flagContent()` est un filet grossier : il n'attrapera jamais une contrefaçon en photo |
| **Sauvegardes testées** | Une sauvegarde jamais restaurée n'est pas une sauvegarde |

## Ce que ce document ne prétend pas

Aucun audit interne ne remplace un test d'intrusion externe. Ce qui est listé ici a été **vérifié**, pas supposé — mais l'absence de faille trouvée n'est pas une preuve d'absence de faille.
