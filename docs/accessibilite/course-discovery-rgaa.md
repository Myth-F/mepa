# Vérification RGAA — découverte des cours

- Date : 23 juin 2026
- Périmètre : page d’accueil, recherche, facettes, tri, pagination et état sans résultat
- Référentiel : RGAA 4.1.2, contrôle ciblé avant audit complet
- Outils : navigation clavier, lecteur d’accessibilité Playwright et inspection à 320 px

## Résultats

| Point contrôlé | Résultat | Preuve |
| --- | --- | --- |
| Recherche nommée et champs étiquetés | Conforme | formulaire `role="search"`, label explicite et bouton nommé |
| Facettes utilisables au clavier | Conforme | liens natifs, focus visible et état actif exposé par `aria-current` |
| Filtres multisélectionnables | Conforme | fieldset/legend pour les mots-clés et cases à cocher natives |
| Résultat d’une action annoncé | Conforme | nombre de résultats en `role="status"` avec `aria-live="polite"` |
| Tri compréhensible sans la couleur | Conforme | libellé textuel et `aria-current` |
| Pagination compréhensible | Conforme | navigation nommée, page courante écrite et liens précédent/suivant |
| État sans résultat guidant | Conforme | titre, conseils et lien de réinitialisation explicite |
| Vitrine de l’accueil structurée | Conforme | titres hiérarchisés, liste de modules et intitulés de liens contextualisés |
| Zoom/reflow à 320 px | Conforme sur le périmètre | les grilles deviennent une colonne et aucun défilement horizontal n’est requis |
| Conservation de l’état partageable | Conforme | recherche, facettes, tri et page restent encodés dans l’URL |

## Limites connues

Cette vérification ciblée ne remplace pas un audit RGAA exhaustif réalisé par un organisme indépendant. La déclaration d’accessibilité indique donc une conformité partielle et documente cette limite.

## Couverture automatisée associée

Les scénarios `course-discovery.spec.ts` et `catalogue-filters-dates.spec.ts` vérifient la recherche, les filtres, le tri, la pagination, l’état sans résultat, les URL partageables, la vitrine et le parcours anonyme.
