## Why

Plusieurs petits problèmes visuels et techniques accumulent une impression de finition insuffisante : absence de favicon, propriété CSS dépréciée `clip`, état `hover` du bouton danger (fond = bordure), mots-clés avec compteurs surchargés, bloc « Bientôt » trop proéminent alors que la fonctionnalité n'est pas disponible.

## What Changes

- Ajout d'un favicon (icône de site dans l'onglet navigateur)
- Remplacement de la propriété CSS `clip` dépréciée par `clip-path`
- Ajustement visuel de `.btn--danger:hover` si la confusion fond/bordure nuit à la lisibilité
- Réduction de la zone de compteurs de mots-clés (compteurs sur survol ou moins visibles)
- Compactage ou déplacement du bloc « Bientôt » (assistant pédagogique) en bas de page

## Capabilities

### New Capabilities
_(aucune — corrections visuelles et techniques)_

### Modified Capabilities
_(aucun)_

## Impact

- Assets publics (favicon)
- CSS global / Tailwind (clip → clip-path, btn--danger)
- Composant de filtres mots-clés du catalogue
- Composant d'assistant pédagogique sur les pages module
