## Why

Aucun mécanisme de récupération de mot de passe n'est proposé sur la page de connexion. Un utilisateur bloqué n'a aucun moyen de retrouver son accès, ce qui entraîne des comptes abandonnés et nuit à la crédibilité de la plateforme.

## What Changes

- Ajout d'un lien « Mot de passe oublié ? » sur la page de connexion
- Parcours de réinitialisation par e-mail : demande → lien à usage unique → nouveau mot de passe
- Les règles de mot de passe sont affichées avant soumission avec un indicateur de robustesse
- Ajout d'un bouton afficher/masquer sur tous les champs mot de passe

## Capabilities

### New Capabilities
- `password-reset`: Parcours de réinitialisation de mot de passe par e-mail (token à usage unique, expiration)

### Modified Capabilities
- `learner-auth`: Formulaire de connexion mis à jour avec lien de récupération et meilleure UX du champ mot de passe

## Impact

- Page /account/sign-in (lien ajouté)
- Nouvelles pages /account/forgot-password et /account/reset-password
- Service d'envoi d'e-mail (transactionnel)
- Base de données : table de tokens de réinitialisation
