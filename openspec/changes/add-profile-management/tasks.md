## 1. Nettoyage des données de test

- [x] 1.1 Identifier et supprimer les comptes/pseudonymes de test visibles dans le classement (« fkfdnfnsdof », « Sossouille_test », etc.)
- [x] 1.2 Mettre en place une règle de modération minimale sur les pseudonymes (longueur, caractères autorisés)

## 2. Page de modification du profil

- [x] 2.1 Créer la page /account/settings (ou intégrer dans le dashboard)
- [x] 2.2 Formulaire de modification du pseudonyme avec validation (unicité, règles)
- [x] 2.3 Route API PATCH /api/learner/profile pour mettre à jour le pseudonyme
- [x] 2.4 Prévisualiser en temps réel comment le pseudonyme apparaît dans le classement

## 3. Contrôles de confidentialité du classement

- [x] 3.1 Ajouter sur la page classement un lien vers les paramètres de confidentialité
- [x] 3.2 Option de retrait du classement directement depuis les paramètres
- [x] 3.3 Bouton « Signaler un pseudonyme inapproprié » sur la page classement (envoie un signalement aux admins)
- [x] 3.4 Interface admin pour traiter les signalements de pseudonymes

## 4. Tests

- [x] 4.1 Test : modifier le pseudonyme → nouveau nom visible dans le classement
- [x] 4.2 Test : se retirer du classement → entrée disparaît immédiatement
- [x] 4.3 Test : pseudonyme invalide → message d'erreur explicite
