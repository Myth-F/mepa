## Why

L'indication « Étape 1 sur 3 » est incompréhensible quand les trois étapes sont toutes visibles sur la même page. Après validation d'une réponse au quiz, la page remonte en haut ce qui interrompt la lecture. L'apprenant n'a aucun indicateur de progression tout au long du module.

## What Changes

- Ajout d'une barre de progression indiquant l'avancement dans le module
- L'indication d'étape reflète l'étape active au défilement (ou les étapes sont révélées progressivement)
- Après validation d'une réponse de quiz, la page conserve la position de lecture et le résultat est clairement visible
- Des boutons « Étape précédente / suivante » ou un ancrage scrollent vers l'étape concernée

## Capabilities

### New Capabilities
- `module-progress-indicator`: Barre de progression et navigation entre étapes d'un module

### Modified Capabilities
- `module-content`: Le comportement de scroll après validation du quiz ne remonte plus en haut de page

## Impact

- Composants de page module (/modules/*)
- Logique de quiz (gestion du scroll après validation)
- CSS / layout de la page module
