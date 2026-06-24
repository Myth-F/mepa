## Why

Un apprenant peut actuellement marquer un module comme terminé et gagner des points sans avoir répondu aux questions du quiz. Cela vide le mécanisme de validation de tout sens pédagogique et compromet la fiabilité du classement.

## What Changes

- Le bouton « Marquer comme terminé » est désactivé tant que les étapes quiz et dilemme ne sont pas complétées
- Le serveur vérifie côté back-end que toutes les questions obligatoires ont été répondues avant d'enregistrer la complétion et d'attribuer les points
- La progression est rendue visible par étape pour que l'apprenant sache ce qui lui reste à faire

## Capabilities

### New Capabilities
- `module-completion-gate`: Validation serveur et client de la complétion d'un module (quiz + dilemme requis avant attribution de points)

### Modified Capabilities
- `gamification`: Le déclenchement des points de complétion est conditionné à la validation de toutes les étapes

## Impact

- API route de complétion de module (vérification supplémentaire)
- Composant de module côté client (état du bouton)
- Logique d'attribution de points (gamification)
