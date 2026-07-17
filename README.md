# Boutik — Plateforme SaaS de boutiques en ligne africaines

**boutik-app.com**

📄 **[DEPLOIEMENT.md](DEPLOIEMENT.md)** — tout ce que tu dois faire pour mettre en ligne
🔒 **[SECURITE.md](SECURITE.md)** — audit, ce qui est vérifié et ce qui reste à faire

MVP front-end **complet**. Le vendeur crée et personnalise toute sa boutique sans toucher au code.

## Lancer

```bash
npm install
npm run dev
```
→ http://localhost:3000

### Deux modes

**Mode démo** (par défaut, sans `.env.local`) — tout vit dans `localStorage`, aucune connexion requise. Pratique pour montrer le produit ou travailler l'UI.

**Mode Supabase** — copier `.env.example` vers `.env.local` et renseigner :

```
NEXT_PUBLIC_SUPABASE_URL=https://<projet>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<clé anon>
```

Puis appliquer les migrations (voir `supabase/README.md`). L'auth OTP, la persistance, l'upload d'images et les commandes deviennent réels.

Le basculement est automatique : `lib/supabase.ts` détecte la présence des variables.

## Parcours à tester

1. **`/creer`** — wizard : nom, logo, couleur, modèle, WhatsApp → boutique créée
2. **`/dashboard/produits`** — « Ajouter un produit » : photo du téléphone, prix, stock, tailles, mise en avant
3. **`/dashboard/boutique`** — onglet **Design** : change d'offre pour voir les modèles se débloquer, change de modèle → **l'aperçu se met à jour en direct**
4. **`/boutique`** — la boutique publique reflète immédiatement tous les changements
5. **`/boutique/commande`** — passe une commande → **ouvre vraiment WhatsApp** avec le bon de commande

## Les 9 templates

| Offre | Template | Parti pris visuel |
|---|---|---|
| Starter | **Classique** | Bannière colorée + réassurance + sélection. Polyvalent. |
| Starter | **Catalogue** | Tout le stock dès l'accueil, groupé par catégorie, grille dense 5 colonnes. |
| Starter | **Vitrine** | Éditorial : héros pleine largeur, grille aérée, citation. |
| Business | **Fashion** | Magazine : visuel plein cadre, titre superposé, défilé horizontal. |
| Business | **Beauty** | Pastel arrondi, sections alternées, bénéfices produits. |
| Business | **Food** | Menu : ancres par catégorie, lignes lisibles, prix à droite. |
| Premium | **Luxury Brand** | Fond sombre, lettrage très espacé, beaucoup de vide. |
| Premium | **Modern Store** | Grille bento asymétrique, blocs colorés. |
| Premium | **Artisan** | Pièces numérotées (01, 02…), chaque article raconté. |

**Verrouillage par offre** : un vendeur Starter voit les modèles Business/Premium (avec cadenas) mais ne peut pas les activer. `TIER_ACCESS` dans `lib/store.tsx`.

> L'onglet Design contient un **sélecteur d'offre de démo** pour tester le verrouillage. En production, `config.plan` doit suivre l'abonnement réellement payé — c'est le seul endroit à rebrancher.

## Ce que le vendeur personnalise (zéro code)

| Onglet | Contenu |
|---|---|
| **Identité** | Nom, slogan, **import de logo** (+ 24 icônes en repli), histoire |
| **Design** | Offre, **25 palettes**, 9 modèles |
| **Accueil** | Badge, titre, texte, **libellé du bouton**, **arguments de réassurance**, **titres de section** |
| **Contact** | WhatsApp, téléphone, Instagram, horaires |
| **Livraison** | Zones : ajout/suppression, tarifs, délais, **conditions** |

**Produits** : ajout / modification / suppression, **import photo** (redimensionnée 900 px + compressée), prix barré, stock, catégories, variantes, mise en avant. Quota par offre (Gratuit 3 · Starter 10 · Business 50 · Premium ∞).

## Système de palettes

25 palettes réparties en 5 familles (Chaleureux, Naturel, Élégant, Vif, Doux). Chacune définit **7 couleurs accordées** : accent, accent secondaire (dégradé de bannière), fond, surface, encre, texte secondaire, texte sur accent.

Un clic applique la palette à **toute la boutique** via des variables CSS (`--accent`, `--bg`, `--surface`…) posées sur `.shop-scope` : bannière, boutons, prix, cartes, fonds, footer. Le vendeur ne compose jamais de couleurs à la main — il choisit une ambiance.

Défini dans `lib/palettes.ts`. Ajouter une palette = ajouter un objet, rien d'autre à toucher.

## Gestion des produits

Ajouter · Modifier · **Dupliquer** (variantes d'un même article) · **Réordonner** (l'ordre de la liste = l'ordre en boutique) · **Masquer** (retiré de la vitrine, conservé dans le dashboard) · Supprimer · Mettre en avant.

## Parti pris design

- **Zéro emoji dans l'interface.** Tout est en icônes Lucide (même famille, rendu identique sur tous les appareils). Les emojis ne subsistent que dans les *messages WhatsApp* générés — c'est là qu'ils sont naturels.
- **Logo importable.** Le vendeur met son vrai logo ; les 24 icônes ne servent que de repli tant qu'il n'en a pas.
- **Miniatures = vraies boutiques.** Les aperçus des 9 modèles reproduisent la mise en page réelle (en-tête, bannière, grille) et reprennent le logo et la couleur du vendeur.
- **Photos produits.** Placeholder icône discret quand la photo manque, jamais un emoji.

## Boutiques de démonstration

> **Isolation stricte.** Les aperçus (`/apercu/<modele>`) montent le `StoreProvider` en mode `demo` : **aucune requête vers la base**. Sans ce garde-fou, l'aperçu affichait la boutique d'un vrai vendeur — celle qui se trouvait première en base, puisque la policy de lecture publique autorise toute boutique publiée. Un visiteur pouvait donc tomber sur une boutique vide ou mal faite, présentée comme un modèle.
>
> Deux corrections liées : `fetchMyShop()` filtre désormais sur `owner_id`. Un `select().limit(1)` sans filtre renvoyait n'importe quelle boutique publiée.

Chaque boutique a **ses propres visuels produits** (`public/demo/`, 54 fichiers de ~7 Ko, générés aux couleurs de la palette). Une boutique sans photos donne l'impression d'être vide — exactement ce qu'on ne veut pas montrer à un vendeur qu'on cherche à convaincre.

`lib/demo-shops.ts` — neuf vraies boutiques, un métier chacune : Kadi Store (wax), Mama Épicerie, Atelier Nima (céramique), SAPE & CO (streetwear), Baobab Soins, Chez Tantie (restauration), Maison Adjo (joaillerie), PIXEL (tech), Bois & Racines (mobilier).

Chacune a ses produits, ses prix, sa palette et son texte. Un carré de couleur ne vend rien : le visiteur doit voir une vraie boutique pour se projeter. Les aperçus sont rendus en HTML/CSS (`components/shop-preview.tsx`) plutôt qu'en captures : plus léger, net à tous les zooms, et suit la palette.

## Marque

Logo dans `public/` : `logo-boutik.png` (nav, 4 Ko), `logo-splash.png` (démarrage, 32 Ko), `icon-192/512.png` (PWA), `favicon.png`.

Tous détourés (fond transparent) et **quantifiés sur 64 couleurs** : un trait monochrome antialiasé contient des milliers de nuances inutiles. Gain : 132 Ko → 4 Ko sur le logo de nav.

**Écran de démarrage** (`components/splash.tsx`) — affiché une fois par session via `sessionStorage`, 1,1 s. Pas à chaque navigation : un vendeur qui revient dix fois par jour n'a pas à le subir.

## Messagerie interne

Le client ne doit pas déranger le vendeur sur WhatsApp. **Seule la commande** part sur WhatsApp ; les questions passent par `/boutique/contact` et arrivent dans `/dashboard/messages`.

- **Purge automatique** : 7 jours après lecture, 30 jours si jamais ouvert. Le compte à rebours démarre à l'ouverture du message — un vendeur qui lit le matin garde le fil jusqu'au soir.
- **Anti-flood** appliqué en base : 3 messages/heure/boutique par expéditeur.
- Le visiteur **écrit mais ne lit jamais** : aucune policy SELECT pour `anon`, sinon n'importe qui listerait les questions et numéros de tous les clients.

## Rôles

| Rôle | Accès |
|---|---|
| Gratuit / Starter / Business / Premium | Sa boutique uniquement, quotas selon l'offre |
| **Admin** | Toutes les boutiques, stats globales, suspension, modération |

`/dashboard/admin` — stats plateforme, répartition des offres, recherche, suspension/réactivation. La protection est **en base** (vues filtrées par `auth_is_admin()`) : forcer l'URL ne montre rien.

## Pages (18 routes)

| Route | Rôle |
|---|---|
| `/` | Landing |
| `/connexion` | Connexion (mot de passe), inscription, code, mot de passe oublié |
| `/connexion/nouveau-mot-de-passe` | Réinitialisation depuis le lien email |
| `/creer` | Wizard — crée une vraie boutique en base |
| `/boutique/*` | Aperçu de la boutique par le vendeur |
| `/b/<slug>` | **Vitrine publique** — en prod, `<slug>.boutik.shop` réécrit ici |
| `/apercu/<template>` | Aperçu public d'un modèle, navigable |
| `/dashboard` | Aperçu, commandes, **messages**, produits, boutique, abonnement, **admin** |

## Authentification

**Mot de passe par défaut, OTP seulement quand c'est nécessaire.** Un code à chaque connexion coûterait un email à chaque fois ; ici on n'en envoie qu'à l'inscription et sur un appareil inconnu — une poignée par vendeur et par an.

| Situation | Ce qui se passe | Email envoyé |
|---|---|---|
| Inscription | Email + mot de passe, puis code de confirmation | ✅ 1 |
| Connexion habituelle | Email + mot de passe | ❌ aucun |
| Connexion, appareil inconnu | Mot de passe OK → code envoyé par email | ✅ 1 |
| Mot de passe oublié | Lien de réinitialisation | ✅ 1 |

**Reconnaissance d'appareil** (`lib/auth.tsx`) — un jeton aléatoire est posé dans le navigateur au premier passage, et la liste des appareils validés est mémorisée **par compte**. Vérifié : un navigateur neuf exige un code, et valider un appareil pour un compte n'en valide aucun autre.

Point important : quand le mot de passe est bon mais l'appareil inconnu, **la session est coupée avant d'exiger le code**. Sans ça, la vérification serait cosmétique — la session serait déjà ouverte.

**Sécurité du mot de passe** — 8 caractères minimum, au moins une lettre et un chiffre, avec une jauge de force en direct. Le mot de passe remplace l'OTP à chaque connexion : c'est devenu le maillon faible, d'où le minimum imposé.

**Autres protections :**
- **Session persistante** : Supabase renouvelle le token en silence
- **« Rester connecté »** décochable → session en `sessionStorage`, effacée à la fermeture (téléphone partagé, cybercafé)
- **Correction des fautes de domaine** : `gmial.com` → propose `gmail.com`. Sans ça, le vendeur attend un code qui n'arrivera jamais.

> **Limite assumée :** l'empreinte vit dans le navigateur. Elle protège contre un mot de passe volé utilisé ailleurs, pas contre quelqu'un qui a déjà le téléphone déverrouillé du vendeur. C'est le compromis habituel des banques en ligne. En navigation privée, le code sera redemandé à chaque fois — c'est voulu.

### SMTP à configurer

Le SMTP intégré de Supabase est limité à ~3-4 emails/heure : **inutilisable en production**.

**Resend** (3 000 emails/mois gratuits) — *Auth → Settings → SMTP* :

```
Host     : smtp.resend.com
Port     : 587
Username : resend        ← littéralement, pas ton email
Password : re_xxxxx      ← clé API
```

**Le domaine doit être vérifié chez Resend** (SPF + DKIM), sinon l'envoi est limité à ta propre adresse.

Avec ce modèle d'authentification, le volume reste très faible : quelques emails par vendeur et par an. Le gratuit suffit longtemps.

Voir `supabase/email-templates/` pour les modèles à coller, et `DEPLOIEMENT.md` pour la marche à suivre.

## Quotas photos

| Offre | Photos / produit |
|---|---|
| Gratuit · Starter | 1 |
| Business | 3 |
| Premium | 5 |

**Ce n'est pas le stockage qui contraint** — une photo de 3-5 Mo prise au téléphone est redimensionnée à 900 px et compressée en JPEG 85 % **avant tout envoi** : elle passe à ~120 Ko, un facteur 30. Le vendeur ne peut pas envoyer 3 Mo même s'il essaie.

Le vrai plafond est l'**egress** : 5 Go/mois sur le plan Supabase gratuit. Chaque visite de fiche produit télécharge ses photos.

## Couleurs

Les couleurs sont **listées, sans photo dédiée** — une photo par couleur multiplierait l'egress d'autant. Le client choisit sa couleur à la commande ; elle part dans le message WhatsApp, la base et le PDF.

Vérifié de bout en bout : `• Robe wax « Ama » (L, Rouge) × 2 — 37 000 F`

## Photos produits

`components/photo-editor.tsx` — s'ouvre dès qu'un vendeur choisit une image.

Luminosité, contraste, zoom, rotation, fond uni, **recadrage carré automatique** (un catalogue aux vignettes inégales fait immédiatement amateur). Tout en canvas : ~15 Ko, aucun appel réseau.

> **Pas de détourage IA, volontairement.** Il faudrait un modèle de ~5 Mo à télécharger, sur un téléphone d'entrée de gamme en 3G, pour un résultat médiocre sur une photo mal éclairée — le cas exact de nos vendeurs. Le fond uni dépanne ; le détourage viendra par API.

## Guide de démarrage

`components/onboarding.tsx` — un vendeur qui arrive sur un dashboard vide ne revient pas.

Checklist en 5 étapes qui **se cochent seules** à partir de l'état réel : on ne demande jamais « as-tu fait ceci ? », on regarde. Une seule aide affichée à la fois. Disparaît définitivement une fois terminée.

## PWA & notifications

- **Service worker** (`public/sw.js`) — le cache ne touche **jamais** l'API : une commande périmée est pire qu'une erreur réseau. Seuls la coquille et les images sont mises en cache.
- **Installation** — bouton natif sur Android ; sur iOS, aucune API n'existe, donc le geste est **expliqué** (Partager → Sur l'écran d'accueil). Personne ne le devine.
- **Push** — la permission n'est demandée qu'après une action qui la justifie. Un refus est définitif : demander trop tôt, c'est perdre le canal à vie.

## Bons de commande PDF

Générés avec **jsPDF, côté client** :
- Zéro appel serveur → **fonctionne même quand la 3G tombe**
- Zéro coût d'infrastructure
- Disponible en ~200 ms

Mise en page A4 aux couleurs de la boutique : bandeau, bloc client, tableau produits, totaux, mention légale. Saut de page automatique au-delà de ~25 lignes.

Accessible depuis `/dashboard/commandes` (le vendeur) et l'écran de confirmation (le client).

> **Limite assumée :** le PDF n'est ni signé ni infalsifiable, d'où la mention « Ce document ne vaut pas facture ». Le jour où une vraie facture comptable sera nécessaire (abonnements), il faudra la générer côté serveur.

## Le paiement

Tout l'écran `/dashboard/abonnement` est prêt : offres, quotas, échéance, choix d'opérateur (Wave / Orange / MTN / Moov), historique.

**Un seul point à remplir** : la fonction `startCheckout()` dans `app/dashboard/abonnement/page.tsx`. Le chemin complet y est documenté (intention → redirection → webhook → `subscriptions` → `shops.plan`).

## Réseau instable

Le marché cible est en 3G qui tombe. Ce qui est en place :

- **Bandeau hors ligne** dès que la connexion coupe
- **Timeout de 12 s** sur le chargement — un écran d'erreur avec « Réessayer » plutôt qu'un spinner éternel
- **Écriture différée** (700 ms) dans l'éditeur : le vendeur tape, on n'envoie qu'après la pause. Sans ça, chaque frappe = une requête.
- **Mises à jour optimistes** : l'UI répond tout de suite, rollback si le serveur refuse
- **Squelettes de chargement** plutôt que des spinners nus

## Architecture

```
lib/store.tsx           Source de vérité : ShopConfig + produits, persistance, quotas, gating
lib/cart.tsx            Panier (localStorage)
lib/data.ts             Données de démo + statuts de commande
components/templates.tsx    Les 6 templates Business/Premium
components/template-sketch.tsx  Miniatures des 9 (wizard, éditeur, landing)
app/boutique/page.tsx   Routeur des 9 templates + états vide/chargement
```

Stack : Next.js 14 (App Router) · React 18 · TypeScript · Tailwind · Framer Motion · lucide-react

## Persistance actuelle

`localStorage` (clé `boutik-store-v1`), écriture protégée par try/catch. **À remplacer par l'API + PostgreSQL** : le contrat de données (`ShopConfig`, `Product`) est déjà défini, le branchement backend se fera sans toucher aux écrans.

## Base de données

Le schéma Supabase complet est dans `supabase/` : 14 tables, 29 policies RLS, 12 triggers métier, testé sur PostgreSQL 16.

**L'isolation multi-tenant est intégrée dès la conception** — RLS actif sur toutes les tables, un vendeur ne peut jamais lire les données d'un autre même si une requête oublie son filtre.

```bash
psql <connection-string> -f supabase/tests/isolation_test.sql   # 19 assertions
```

Voir `supabase/README.md` pour la mise en route et les décisions de sécurité.

## Reste à faire (backend)

1. ~~Schéma + isolation multi-tenant~~ — **fait**, voir `supabase/`
2. Brancher le front sur Supabase (remplacer `localStorage`)
3. Auth OTP WhatsApp/SMS — **penser au rate limiting sur l'envoi et la vérification**
4. Upload images → Storage (buckets et policies déjà créés)
5. Génération PDF serveur des bons de commande
6. Agrégateur Mobile Money → doit piloter `shops.plan` via `subscriptions`
7. PWA : manifest + service worker + push
