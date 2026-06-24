## 1. Correction du bug de réinitialisation visuelle

- [x] 1.1 Identifier le composant du bouton « Voir tous les modules »
- [x] 1.2 Ajouter la réinitialisation des filtres et tris sélectionnés dans son handler
- [x] 1.3 Tester : activer un filtre → cliquer « Voir tous les modules » → vérifier que le filtre est visuellement décoché

## 2. Sélection multiple de filtres

- [x] 2.1 Modifier le composant de filtres pour accepter plusieurs valeurs par catégorie
- [x] 2.2 Adapter les query params URL pour encoder la multi-sélection (ex: `?theme=a&theme=b`)
- [x] 2.3 Adapter la requête côté serveur pour filtrer avec OR sur plusieurs thèmes

## 3. Résumé des filtres actifs

- [x] 3.1 Créer un composant `ActiveFiltersBar` affichant les filtres et tri actifs sous forme de tags
- [x] 3.2 Chaque tag a un bouton de suppression pour retirer ce filtre spécifiquement
- [x] 3.3 Ajouter un bouton « Tout réinitialiser » visible dès qu'un filtre est actif
- [x] 3.4 Afficher le nombre de résultats (ex: « 4 modules »)

## 4. Amélioration visuelle des états actifs

- [x] 4.1 Renforcer le contraste visuel des filtres et tris actifs (couleur, icône, fond)
- [x] 4.2 Corriger le double soulignement sur filtre sélectionné

## 5. Tests

- [x] 5.1 Tester la sélection multiple : 2 thèmes sélectionnés → liste filtrée avec union
- [x] 5.2 Tester la suppression unitaire d'un filtre tag
- [x] 5.3 Tester la réinitialisation complète
