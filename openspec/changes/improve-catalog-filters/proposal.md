## Why

Le catalogue ne permet pas la sélection de plusieurs thèmes simultanément, ce qui limite l'exploration croisée. Il n'y a pas de résumé des filtres et tris actifs, et le bouton « Voir tous les modules » ne réinitialise pas visuellement les filtres sélectionnés, induisant l'utilisateur en erreur.

## What Changes

- Les filtres de thème/catégorie acceptent une sélection multiple
- Un résumé des filtres actifs s'affiche en haut de la liste avec le nombre de résultats et un bouton « Tout réinitialiser »
- Le bouton « Voir tous les modules » réinitialise aussi l'état visuel des filtres
- Les filtres actifs sont présentés comme des tags supprimables

## Capabilities

### New Capabilities
- `catalog-filter-ux`: Sélection multiple de filtres, résumé persistant, réinitialisation complète

### Modified Capabilities
_(aucun changement de specs existant)_

## Impact

- Page /modules (composant de filtres)
- État URL (query params pour filtres multiples)
- Route API ou server action de liste des modules (support multi-valeurs)
