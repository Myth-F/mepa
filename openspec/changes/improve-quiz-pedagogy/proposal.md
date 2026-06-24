## Why

Les quiz proposent parfois des distracteurs trop génériques ou peu crédibles (notamment sur l'environnement), ce qui réduit la valeur pédagogique. Après une réponse, l'apprenant n'obtient aucune explication sur pourquoi sa réponse était juste ou fausse, manquant ainsi l'opportunité d'apprentissage principale.

## What Changes

- Après chaque réponse, une explication pédagogique est affichée (correcte ou non) avec un lien vers la source
- Les distracteurs des questions sont revus pour être plausibles et pédagogiquement pertinents
- La bonne réponse est clairement mise en évidence après validation

## Capabilities

### New Capabilities
- `quiz-explanations`: Affichage d'une explication et d'un lien source après chaque réponse de quiz

### Modified Capabilities
- `module-content`: Le modèle de données des questions de quiz inclut un champ `explanation`

## Impact

- Schéma de la base de données (champ `explanation` sur les questions)
- Interface d'administration (/admin) pour saisir les explications
- Composant de quiz côté apprenant
- Données existantes des questions (migration et enrichissement)
