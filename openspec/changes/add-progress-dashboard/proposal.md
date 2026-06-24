## Why

L'espace personnel est annoncé comme une fonctionnalité clé mais le détail de la progression n'est pas visible une fois connecté. L'apprenant ne peut pas voir ses modules commencés/terminés, ses scores, ses points ou la prochaine étape recommandée, ce qui vide la notion de compte de sa valeur.

## What Changes

- Création d'un tableau de bord de progression dans l'espace apprenant
- Affichage des modules commencés et terminés avec score quiz
- Affichage des points cumulés, niveau et prochaine étape recommandée
- Clarification des données conservées et durée de session

## Capabilities

### New Capabilities
- `learner-dashboard`: Tableau de bord de progression avec modules, scores, points et niveau

### Modified Capabilities
- `gamification`: Les points et niveaux sont exposés dans le dashboard apprenant (pas seulement dans le classement)

## Impact

- Espace apprenant (pages et composants)
- Route API de récupération de la progression
- Schéma de données (progression par module, scores)
