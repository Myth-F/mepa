## 1. Correction du scroll après quiz

- [x] 1.1 Identifier le handler de validation de réponse quiz qui provoque le scroll en haut
- [x] 1.2 Supprimer ou remplacer le comportement de scroll automatique vers le haut
- [x] 1.3 S'assurer que le résultat (bonne/mauvaise réponse) est visible sans déplacement
- [x] 1.4 Tester : valider une réponse → rester à la position de la question

## 2. Barre de progression

- [x] 2.1 Créer un composant `ModuleProgressBar` affichant l'étape active / total
- [x] 2.2 Intégrer la barre en haut de la page module (sticky ou fixe)
- [x] 2.3 Mettre à jour l'étape active à l'entrée visible de chaque section (IntersectionObserver)

## 3. Navigation entre étapes

- [x] 3.1 Clarifier l'indication « Étape N sur 3 » pour qu'elle reflète l'étape visible
- [x] 3.2 Ajouter des ancres / boutons « Étape suivante » permettant de scroller jusqu'à l'étape concernée
- [x] 3.3 Vérifier l'accessibilité : aria-label sur la barre de progression, focus management

## 4. Tests

- [x] 4.1 Tester le flux complet : lecture → quiz → scroll fixe → dilemme → complétion
- [x] 4.2 Tester sur mobile (scroll et barre de progression responsive)
