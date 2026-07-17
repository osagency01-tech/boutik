# Performance — ce qui a été fait

## Le bug mobile (page blanche + liens bleus)

**Cause :** `upgrade-insecure-requests` dans la CSP. Cette directive force le navigateur à réécrire toute URL `http://` en `https://`. En production c'est excellent. En développement, ton téléphone accède au site via `http://192.168.x.x:3000` — le CSS et le JS étaient donc demandés en `https` sur un serveur qui ne parle que `http`. Résultat : HTML seul, sans style.

**Correction :** cette directive et HSTS ne sont plus envoyées qu'en production (`next.config.mjs`, constante `isProd`).

> HSTS était encore plus dangereux en dev : le navigateur mémorise la règle **2 ans** et refuse ensuite tout accès `http` à cette IP — y compris pour tes autres projets.

**Pour tester sur mobile :**
```bash
npm run dev -- -H 0.0.0.0
```
Puis `http://<ton-ip>:3000` (l'IP donnée par `ipconfig`).

## La lenteur

**Coupable : Framer Motion** (~115 Ko), importé par 27 fichiers pour faire… des fondus.

| Action | Gain |
|---|---|
| `Reveal` / `Stagger` réécrits en CSS + IntersectionObserver | utilisés sur ~toutes les pages |
| Splash, bandeau d'installation, menus, pastille panier → CSS | chargés partout |
| Téléphone animé → chargé au scroll (`next/dynamic` + observer) | 53 Ko hors du chemin critique |
| jsPDF → import à la demande | 130 Ko |
| Logo → 132 Ko à 4 Ko | le plus lourd du site |

**Résultat :**

| Page | Avant | Après |
|---|---|---|
| `/` | 226 Ko | **187 Ko** |
| `/boutique` | 219 Ko | **183 Ko** |
| `/dashboard` | 218 Ko | **180 Ko** |

**Temps ressenti en 3G sur téléphone d'entrée de gamme :**

| Page | Premier affichage | DOM prêt |
|---|---|---|
| `/` | 1,2 s | 1,2 s |
| `/dashboard` | 0,54 s | 0,59 s |
| `/boutique` | 0,46 s | 0,59 s |

> **Note importante sur la mesure.** Les « 4 secondes » que je mesurais au départ correspondaient à `networkidle0` : le moment où *tout* est arrivé, y compris le téléphone animé situé sous la ligne de flottaison. Ce n'est pas ce que ressent l'utilisateur. Les chiffres ci-dessus (FCP, DOM prêt) sont ce qu'il vit vraiment : la page est lisible et cliquable en moins d'une seconde.

## Framer Motion reste utilisé où il apporte quelque chose

18 fichiers : modales, glissement au doigt du téléphone. Tous **hors du chemin critique** — chargés à l'ouverture de la modale ou au scroll, jamais au premier rendu.

## Le logo

Recoloré au vert **exact** des boutons : `#0E8A52` (vérifié pixel par pixel, il était en `#16A085`).

**Un bug attrapé au passage :** la quantification PIL (`Image.quantize`) cassait le canal alpha — le logo plafonnait à 163 d'opacité sur 255 et ses couleurs dérivaient. Remplacé par `pngquant`, qui préserve la transparence.

| Fichier | Poids |
|---|---|
| `logo-boutik.png` (nav) | 4 Ko |
| `logo-splash.png` | 39 Ko |
| `icon-192.png` | 3 Ko |
| `icon-512.png` | 12 Ko |
