# Templates email Supabase

> **Prérequis :** le SMTP doit être configuré (Resend recommandé — voir `DEPLOIEMENT.md`).
> Sans SMTP externe, Supabase est bridé à 3-4 emails/heure.

**À faire une fois, sinon personne ne peut créer de compte.**

Supabase envoie par défaut un **lien de confirmation**. Notre écran attend un **code à 6 chiffres** (`{{ .Token }}`). Sans cette modification, le vendeur reçoit un lien qui ne correspond à rien de ce qu'on lui demande.

## Où

Supabase → **Authentication** → **Email Templates**

Trois templates à remplacer, dans cet ordre d'importance :

| Template | Quand | Fichier |
|---|---|---|
| **Confirm signup** | Création de compte | `confirm-signup.html` |
| **Magic Link** | Connexion depuis un nouvel appareil | `magic-link.html` |
| **Reset Password** | Mot de passe oublié | `reset-password.html` |

> **Reset Password garde un lien** (`{{ .ConfirmationURL }}`), pas un code : notre page `/connexion/nouveau-mot-de-passe` attend une session ouverte par ce lien.

## Comment

1. Ouvre le template
2. Remplace **tout** le contenu par celui du fichier `.html` correspondant
3. Change le **Subject** (indiqué en tête de chaque fichier)
4. Save

## Vérifier

Crée un compte de test. Tu dois recevoir un email avec **6 chiffres bien lisibles**, pas un lien.

Si tu reçois encore un lien : le template n'est pas enregistré, ou tu as modifié le mauvais.

## Variables disponibles

| Variable | Contenu |
|---|---|
| `{{ .Token }}` | Le code à 6 chiffres |
| `{{ .ConfirmationURL }}` | Le lien (pour Reset Password uniquement) |
| `{{ .Email }}` | L'adresse du destinataire |
| `{{ .SiteURL }}` | L'URL du site |
