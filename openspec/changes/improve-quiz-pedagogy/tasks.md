## 1. Modèle de données

- [x] 1.1 Ajouter un champ `explanation` (texte, optionnel) sur le modèle de question quiz dans Prisma
- [x] 1.2 Créer la migration de base de données
- [x] 1.3 Mettre à jour le schéma Zod de validation des questions

## 2. Interface d'administration

- [x] 2.1 Ajouter un champ de saisie « Explication » dans le formulaire d'édition des questions quiz
- [x] 2.2 Permettre d'associer une source (URL + titre) à l'explication

## 3. Composant quiz apprenant

- [x] 3.1 Afficher l'explication après validation d'une réponse (bonne ou mauvaise)
- [x] 3.2 Mettre en évidence visuellement la bonne réponse après validation
- [x] 3.3 Afficher un lien vers la source si disponible
- [x] 3.4 S'assurer que l'explication est accessible (lecteur d'écran, aria-live)

## 4. Enrichissement des données existantes

- [x] 4.1 Rédiger des explications pour les questions des modules déjà en ligne
- [x] 4.2 Revoir les distracteurs signalés comme peu crédibles (notamment module Empreinte environnementale)

## 5. Tests

- [x] 5.1 Test : réponse correcte → explication affichée + bonne réponse en surbrillance
- [x] 5.2 Test : réponse incorrecte → explication affichée + bonne réponse indiquée
- [x] 5.3 Test : question sans explication → pas d'erreur, pas de bloc vide affiché
