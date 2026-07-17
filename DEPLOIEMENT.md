# Mise en ligne — ce que tu dois faire

Domaine : **boutik-app.com**

Ordre important : chaque étape dépend de la précédente. Compte 2-3 h la première fois.

---

## 1. Supabase — la base

**Créer le projet** → [supabase.com](https://supabase.com) → New project
- **Région : Frankfurt (eu-central-1)** — ~80 ms depuis Abidjan contre ~250 ms depuis les US
- Note le mot de passe de base : il ne se réaffiche jamais

**Appliquer le schéma** — SQL Editor, dans cet ordre :
1. `supabase/migrations/001_schema.sql`
2. `supabase/migrations/002_rls.sql`
3. `supabase/migrations/003_storage_lifecycle.sql`
4. `supabase/migrations/004_messages_admin.sql`

**Vérifier** : colle `supabase/tests/isolation_test.sql`. **19 assertions doivent passer.** Un seul échec = ne pas déployer.

---

## 2. Email — sinon personne ne peut créer de compte

Le SMTP intégré de Supabase est bridé à **3-4 emails/heure**. Inutilisable.

**Resend** — [resend.com](https://resend.com), 3 000 emails/mois gratuits, inscription par email ou GitHub (pas de vérification SMS).

### a. Vérifier le domaine

**Indispensable.** Sans domaine vérifié, Resend n'autorise l'envoi qu'à ta propre adresse.

Resend → **Domains** → Add domain → `boutik-app.com`

Il te donne 3 enregistrements DNS à créer **chez IONOS** :

| Type | Rôle |
|---|---|
| TXT (SPF) | Autorise Resend à envoyer pour ton domaine |
| TXT (DKIM) | Signe les emails — sans ça, direction spam |
| MX | Retours d'erreur |

Propagation : 10 min à quelques heures. Attends le statut **Verified** avant la suite.

### b. Créer la clé API

Resend → **API Keys** → Create → permission **Sending access**. Copie-la : elle ne se réaffiche jamais.

### c. Brancher sur Supabase

Authentication → Settings → **SMTP Settings** :

```
Host        : smtp.resend.com
Port        : 587
Username    : resend          ← littéralement "resend", pas ton email
Password    : re_xxxxx        ← ta clé API
Sender email: noreply@boutik-app.com
Sender name : Boutik
```

### d. Les templates — le piège qui va te bloquer

Supabase envoie un **lien** par défaut. Notre écran attend un **code à 6 chiffres**.

Authentication → **Email Templates** → colle le contenu de :

| Template Supabase | Fichier |
|---|---|
| Confirm signup | `supabase/email-templates/confirm-signup.html` |
| Magic Link | `supabase/email-templates/magic-link.html` |
| Reset Password | `supabase/email-templates/reset-password.html` |

> **Reset Password garde un lien** (`{{ .ConfirmationURL }}`), pas un code : la page `/connexion/nouveau-mot-de-passe` a besoin de la session que ce lien ouvre.

### e. Réglages d'authentification

Authentication → Settings :
- ✅ **Enable email confirmations**
- **Rate Limits** — sans ça, on brute-force un code à 6 chiffres et on épuise ton quota

### f. Vérifier

Crée un compte de test. Tu dois recevoir **6 chiffres bien lisibles**, pas un lien. Si tu reçois un lien : le template n'est pas enregistré.

> **Si tu tiens à IONOS pour le SMTP :** leur serveur est fait pour du courrier humain, pas transactionnel. Limite ~500/jour et délivrabilité médiocre — tes codes finiraient en spam. Un code d'inscription en spam, c'est un vendeur perdu à la première minute. À éviter.

## 3. Domaine

**Acheter boutik-app.com** (Namecheap, OVH, Cloudflare…)

**DNS à configurer :**
```
A       @        <IP de ton hébergeur>
CNAME   www      boutik-app.com
CNAME   *        boutik-app.com     ← indispensable : <slug>.boutik-app.com
```

Le **wildcard `*`** est ce qui fait marcher les boutiques. Sans lui, `kadi.boutik-app.com` ne répond pas.

**Cloudflare** est recommandé : SSL wildcard gratuit, CDN avec points de présence africains, protection DDoS.

---

## 4. Hébergement — Vercel (le plus simple)

1. Pousser le code sur GitHub (**jamais `.env.local`**, il est déjà dans `.gitignore`)
2. [vercel.com](https://vercel.com) → Import Project → sélectionner le dépôt
3. **Environment Variables** :
```
NEXT_PUBLIC_SUPABASE_URL      = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
NEXT_PUBLIC_SITE_URL          = https://boutik-app.com
```
4. Settings → Domains → ajouter `boutik-app.com` **et** `*.boutik-app.com`

> ⚠️ **`SUPABASE_SERVICE_ROLE_KEY` ne doit JAMAIS être en `NEXT_PUBLIC_*`.** Cette clé contourne toute la sécurité RLS. Elle ne sert qu'aux webhooks côté serveur.

---

## 5. Te déclarer admin

Une fois ton compte créé sur le site, dans le SQL Editor :
```sql
update profiles set is_admin = true
 where id = (select id from auth.users where email = 'ton@email.com');
```
L'onglet **Admin** apparaîtra dans ton dashboard.

---

## 6. Purges automatiques

**Database → Extensions** → activer `pg_cron`. Puis :
```sql
select cron.schedule('purge-quotidienne', '0 3 * * *', $$
  select expire_grace_periods();
  select purge_expired_shops();
  select purge_old_orders();
  select purge_old_messages();
$$);
```
Sans ça, les messages s'accumulent et les boutiques impayées restent en ligne.

---

## 7. Vérifier avant d'ouvrir aux vrais vendeurs

- [ ] Créer un compte → le code arrive **en moins d'une minute**
- [ ] Se connecter depuis un **autre téléphone** → un code est demandé
- [ ] Créer une boutique → `<slug>.boutik-app.com` répond
- [ ] Ajouter un produit avec une **vraie photo** prise au téléphone
- [ ] Passer une commande → WhatsApp s'ouvre avec le bon message
- [ ] Télécharger un bon de commande PDF
- [ ] Envoyer un message depuis Contact → il arrive dans Messages
- [ ] Vérifier les en-têtes : [securityheaders.com](https://securityheaders.com) → viser A ou A+

---

## Ce qui reste non branché

**Le paiement.** Tout l'écran `/dashboard/abonnement` est prêt : offres, quotas, échéance, choix d'opérateur. Il reste à remplir `startCheckout()` — le chemin complet est documenté dans le fichier.

Concrètement : tu peux ouvrir le site, laisser des vendeurs créer leurs boutiques, et **encaisser les 999 F à la main** par Mobile Money en passant leur `plan` en base. C'est même ce que je te conseille pour les 10 premiers : tu sauras s'ils paient avant d'intégrer un agrégateur.

---

## Coûts au démarrage

| Poste | Prix |
|---|---|
| Domaine | ~10 €/an |
| Supabase | Gratuit (500 Mo, 50k utilisateurs actifs) |
| Vercel | Gratuit (usage non commercial ; ~20 $/mois au-delà) |
| Resend | Gratuit (3 000 emails/mois) |
| Cloudflare | Gratuit |

**Tu peux démarrer pour ~10 €.** Les paliers payants n'arrivent qu'avec le volume.
