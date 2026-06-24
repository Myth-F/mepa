## Why

Un utilisateur ne peut pas modifier son pseudonyme après la création de son compte, ce qui pose problème si le nom choisi est incorrect ou souhaite être changé. La plateforme ne propose pas non plus de contrôles de confidentialité pour le classement (prévisualisation du nom, retrait, signalement).

## What Changes

- Ajout d'une page de modification du profil (pseudonyme)
- Contrôles de confidentialité du classement : prévisualiser son nom affiché, se retirer facilement, signaler un pseudonyme inapproprié
- Les données de test (pseudonymes « fkfdnfnsdof », « Sossouille_test ») sont retirées de la production

## Capabilities

### New Capabilities
- `profile-management`: Modification du pseudonyme et gestion des paramètres de compte
- `leaderboard-privacy`: Contrôles de participation au classement et signalement de pseudonymes

### Modified Capabilities
- `gamification`: Le classement expose un lien vers les paramètres de confidentialité et un bouton de signalement

## Impact

- Espace apprenant (page paramètres)
- API de mise à jour du profil
- Interface de classement
- Données en base (nettoyage des pseudonymes de test)
