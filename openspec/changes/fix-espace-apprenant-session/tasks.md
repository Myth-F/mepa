## 1. Diagnostic

- [x] 1.1 Identifier le composant du bouton « Espace apprenant » et sa cible actuelle
- [x] 1.2 Identifier le middleware de protection des routes et comment la session est lue
- [x] 1.3 Reproduire le bug : se connecter → cliquer sur « Espace apprenant » → observer la redirection vers /sign-in

## 2. Correction du routage

- [x] 2.1 Modifier le bouton pour pointer vers la route du tableau de bord apprenant
- [x] 2.2 Vérifier que le middleware redirige vers /sign-in uniquement si la session est absente
- [x] 2.3 Ajouter une redirection depuis /sign-in vers le dashboard si l'utilisateur est déjà connecté
- [x] 2.4 Écrire un test : utilisateur connecté → accès direct au dashboard sans re-login

## 3. Vérification de déploiement

- [x] 3.1 Tester le flux complet : connexion → bouton « Espace apprenant » → dashboard visible
- [x] 3.2 Tester l'expiration de session : session expirée → redirection vers /sign-in attendue
