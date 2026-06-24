## 1. Favicon

- [x] 1.1 Créer ou choisir une icône adaptée au site (favicon.ico + formats PNG 32x32, 180x180)
- [x] 1.2 Ajouter les balises `<link rel="icon">` dans le layout racine Next.js
- [x] 1.3 Vérifier l'affichage dans l'onglet navigateur

## 2. Corrections CSS

- [x] 2.1 Rechercher toutes les occurrences de `clip:` dans le CSS global et les composants
- [x] 2.2 Remplacer par `clip-path:` avec la valeur équivalente
- [x] 2.3 Vérifier `.btn--danger:hover` : si fond = bordure crée une confusion, différencier légèrement la teinte de bordure
- [x] 2.4 Valider visuellement après les modifications

## 3. Allègement de la zone de mots-clés

- [x] 3.1 Masquer les compteurs numériques par défaut et les afficher au survol (ou les retirer)
- [x] 3.2 Améliorer l'espacement entre les tags de mots-clés
- [x] 3.3 Corriger le double soulignement sur filtre sélectionné (si pas couvert dans improve-catalog-filters)

## 4. Bloc « Bientôt » (assistant pédagogique)

- [x] 4.1 Réduire la taille ou déplacer le bloc en bas de la page module
- [x] 4.2 Ne l'afficher que sur les modules qui auront effectivement un assistant (ou le masquer globalement)
- [x] 4.3 Vérifier que sa suppression/compactage ne casse pas le layout

## 5. Vérification finale

- [x] 5.1 Vérifier le score Lighthouse (bonnes pratiques) après les corrections CSS
- [x] 5.2 Contrôle visuel des pages catalogue et module sur desktop et mobile
