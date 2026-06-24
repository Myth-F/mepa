# Vérification Docker Compose — 24 juin 2026

Environnement isolé : projet Compose `mepa-opsx-verify`, volumes dédiés et secrets temporaires non enregistrés dans le dépôt.

## Résultats

| Contrôle | Résultat observé |
| --- | --- |
| Construction des images | images application, migration et sauvegarde construites |
| Déploiement propre | PostgreSQL et MinIO sains, migration terminée, application saine |
| Vivacité | `/api/health` → `200 {"status":"ok"}` |
| Disponibilité | `/api/ready` → `200 {"status":"ready","db":"up"}` |
| Recréation des conteneurs | ligne PostgreSQL et objet MinIO conservés dans les volumes dédiés |
| Migration invalide | sortie non nulle avec erreur Prisma `P1000`; application existante toujours saine |
| Sauvegarde | dump PostgreSQL compressé et miroir MinIO présents dans `backup_data` |
| Restauration PostgreSQL | dump restauré dans une base vide, marqueur `preserved` retrouvé |
| Restauration MinIO | objet supprimé puis restauré depuis le miroir, contenu `persistent-media` retrouvé |
| Tests dans le stack | 73 tests Vitest, dont les intégrations PostgreSQL, réussis |
| Parcours navigateur | 37 tests Playwright réussis contre l’application conteneurisée |

## Portée

Cette campagne valide le fonctionnement local reproductible du stack et du runbook. Elle ne remplace pas les contrôles propres au VPS : terminaison TLS, routage du proxy Coolify, journaux après déploiement et sauvegarde hors hôte.
