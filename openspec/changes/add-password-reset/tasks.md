## 1. Modèle de données

- [x] 1.1 Créer une migration Prisma : table `PasswordResetToken` (token haché, userId, expiresAt, usedAt)
- [x] 1.2 Ajouter l'index sur userId et le TTL (15 minutes)

## 2. Service de réinitialisation

- [x] 2.1 Écrire la fonction `requestPasswordReset(email)` : génère un token sécurisé, stocke le hash, envoie l'e-mail
- [x] 2.2 Écrire la fonction `validateResetToken(token)` : vérifie hash, expiration, usage unique
- [x] 2.3 Écrire la fonction `applyPasswordReset(token, newPassword)` : change le mot de passe et invalide le token
- [x] 2.4 Écrire les tests unitaires pour les trois fonctions

## 3. Routes API

- [x] 3.1 POST /api/auth/forgot-password : déclenche requestPasswordReset, réponse identique si e-mail inconnu (anti-énumération)
- [x] 3.2 POST /api/auth/reset-password : valide le token et applique le nouveau mot de passe

## 4. Pages

- [x] 4.1 Créer /account/forgot-password : formulaire e-mail + confirmation d'envoi
- [x] 4.2 Créer /account/reset-password?token=... : formulaire nouveau mot de passe + confirmation visuelle de robustesse
- [x] 4.3 Ajouter le lien « Mot de passe oublié ? » sur /account/sign-in
- [x] 4.4 Ajouter le bouton afficher/masquer sur tous les champs mot de passe (sign-in, register, reset-password)
- [x] 4.5 Afficher les règles de mot de passe en temps réel sur register et reset-password

## 5. E-mail transactionnel

- [x] 5.1 Créer le template d'e-mail de réinitialisation (HTML + texte brut, lien valide 15 min)
- [x] 5.2 Intégrer avec le service d'envoi configuré (vérifier .env.example)

## 6. Tests et déploiement

- [x] 6.1 Test e2e : parcours complet oubli → e-mail → reset → connexion avec nouveau mot de passe
- [x] 6.2 Vérifier la configuration des variables d'envoi d'e-mail dans Docker Compose
