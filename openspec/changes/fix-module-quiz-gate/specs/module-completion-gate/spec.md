## ADDED Requirements

### Requirement: La complétion d'un module requiert d'avoir répondu à toutes les questions
Le système NE DOIT PAS enregistrer la complétion d'un module ni attribuer les points associés si l'apprenant n'a pas soumis une réponse à chaque question de quiz et de dilemme du module.

#### Scenario: Apprenant tente de terminer sans répondre au quiz
- **WHEN** un apprenant clique sur « Marquer comme terminé » sans avoir répondu aux questions
- **THEN** le serveur rejette la requête avec une erreur explicite et aucun point n'est attribué

#### Scenario: Apprenant complète toutes les étapes puis termine
- **WHEN** un apprenant a répondu à toutes les questions de quiz et de dilemme
- **THEN** la complétion est enregistrée et les points sont attribués normalement

#### Scenario: Bouton désactivé côté client
- **WHEN** un apprenant n'a pas encore complété le quiz
- **THEN** le bouton « Marquer comme terminé » est visuellement inactif (disabled) avec un message explicatif

#### Scenario: Tentative de contournement via l'API
- **WHEN** une requête de complétion est envoyée directement à l'API sans les prérequis satisfaits
- **THEN** le serveur refuse la complétion indépendamment de l'état du client
