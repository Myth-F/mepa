## 1. Route API de progression

- [x] 1.1 Créer une route GET /api/learner/progress retournant : modules commencés, terminés, scores quiz, points, niveau
- [x] 1.2 Sécuriser la route (authentification requise)
- [x] 1.3 Écrire les tests unitaires de la route

## 2. Composants du tableau de bord

- [x] 2.1 Créer la page du tableau de bord `/account/dashboard` (ou équivalent existant)
- [x] 2.2 Composant `ProgressSummary` : points totaux, niveau actuel, rang au classement (si opt-in)
- [x] 2.3 Composant `ModuleProgressList` : liste des modules avec statut (non commencé / en cours / terminé) et score quiz
- [x] 2.4 Composant `NextStepRecommendation` : suggérer le prochain module selon la progression

## 3. UX et informations complémentaires

- [x] 3.1 Afficher la durée de session et un lien de déconnexion
- [x] 3.2 Indiquer clairement quelles données sont conservées (progression, points)
- [x] 3.3 Proposer un moyen de supprimer/exporter sa progression (RGPD)

## 4. Tests

- [x] 4.1 Test : utilisateur avec progression → dashboard affiche les bons modules et scores
- [x] 4.2 Test : utilisateur sans progression → état vide élégant avec appel à l'action
- [x] 4.3 Test : le bouton « Espace apprenant » mène bien au dashboard (voir aussi fix-espace-apprenant-session)
