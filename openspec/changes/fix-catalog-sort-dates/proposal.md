## Why

Le tri « Plus récents » produit le même ordre que le tri par pertinence, rendant cette option inutile. Aucune date n'est affichée sur les cartes modules, ce qui rend impossible pour l'utilisateur de vérifier que le tri est correct ou d'évaluer la fraîcheur du contenu.

## What Changes

- Le tri « Plus récents » est corrigé pour trier par date de publication/mise à jour réelle
- Les cartes modules affichent la date de publication ou de dernière mise à jour
- Les dates et versions des contenus sont stockées et exposées

## Capabilities

### New Capabilities
- `module-content-dates`: Affichage de la date de publication et de mise à jour sur les cartes et pages de module

### Modified Capabilities
- `course-discovery`: Le tri « Plus récents » est fonctionnel et se base sur la date de publication

## Impact

- Schéma Prisma (champs `publishedAt`, `updatedAt` sur les modules)
- Route/server action de liste des modules (tri par date)
- Cartes modules (affichage de la date)
- Interface d'administration (saisie et modification des dates)
