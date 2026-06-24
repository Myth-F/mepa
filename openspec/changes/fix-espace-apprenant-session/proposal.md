## Why

Le bouton « Espace apprenant » renvoie vers la page de connexion même lorsque l'utilisateur est déjà authentifié. Ce bug bloque l'accès à l'espace personnel et donne l'impression que la session n'est pas reconnue.

## What Changes

- Le bouton « Espace apprenant » redirige vers le tableau de bord si l'utilisateur est connecté
- La page cible vérifie la session et ne présente pas le formulaire de connexion à un utilisateur déjà authentifié
- Un lien de retour est ajouté si la session expire entre-temps

## Capabilities

### New Capabilities
_(aucune nouvelle capacité — correction d'un bug de routage)_

### Modified Capabilities
- `learner-auth`: Le routage post-authentification et la protection des routes tiennent compte de la session active

## Impact

- Composant du bouton « Espace apprenant » (lien et logique de redirection)
- Middleware / guards de routes protégées
- Page de connexion (ne pas afficher si déjà connecté)
