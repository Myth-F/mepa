## 1. Validation serveur

- [x] 1.1 Identifier la route API de complétion de module et lire la logique actuelle
- [x] 1.2 Ajouter une vérification : toutes les questions du module ont une réponse soumise par cet apprenant
- [x] 1.3 Retourner une erreur 422 explicite si des questions sont sans réponse
- [x] 1.4 Écrire un test : complétion refusée sans réponses
- [x] 1.5 Écrire un test : complétion acceptée après toutes les réponses

## 2. Verrouillage côté client

- [x] 2.1 Récupérer l'état de progression (questions répondues) dans le composant de module
- [x] 2.2 Désactiver le bouton « Marquer comme terminé » si des questions sont en attente
- [x] 2.3 Afficher un message contextuel expliquant ce qui reste à compléter
- [x] 2.4 Activer le bouton dès que toutes les étapes sont satisfaites

## 3. Vérification de déploiement

- [x] 3.1 Vérifier que la logique fonctionne en Docker Compose local
- [x] 3.2 Tester le flux complet : quiz → dilemme → complétion → points attribués
