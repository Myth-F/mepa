# Gamification

La gamification récompense uniquement des actions pédagogiques enregistrées côté
serveur. Le client ne transmet jamais de quantité de points.

## Règles de points

| Action                                |             Points |
| ------------------------------------- | -----------------: |
| Module terminé                        |                 50 |
| Quiz réussi                           |                 20 |
| Quiz réussi dès la première tentative | 10 supplémentaires |
| Participation à un dilemme            |                  5 |

Chaque attribution est liée à l'enregistrement source et à la version publiée du
module. La contrainte unique `(learnerId, kind, sourceId)` empêche une double
attribution lors d'un nouvel envoi.

## Niveaux

Les seuils cumulés sont : niveau 1 à 0 point, niveau 2 à 100, niveau 3 à 250,
niveau 4 à 500 et niveau 5 à 1 000. Après le niveau 5, un niveau supplémentaire
est accordé tous les 750 points.

## Classement et vie privée

Le classement est désactivé par défaut. Une personne choisit explicitement d'y
apparaître depuis son espace personnel et peut se retirer immédiatement. Seuls le
pseudonyme, le niveau et les points sont affichés. L'adresse e-mail et les
identifiants internes ne sont jamais exposés.

## Recalcul et reprise historique

Recalculer les agrégats à partir des événements existants :

```bash
npm run gamification:recompute
```

Créer d'abord les événements correspondant aux anciennes actions, puis recalculer :

```bash
npm run gamification:recompute -- --backfill
```

Le backfill est une opération explicite. Il n'est pas exécuté automatiquement au
déploiement.
