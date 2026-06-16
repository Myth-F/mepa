# Audit réseau et déploiement Coolify

> Date : 2026-06-16 · Périmètre : `compose.yaml`, `Dockerfile`, endpoints de santé,
> proxy Coolify, persistance des modules.

## Synthèse

Le symptôme observé côté navigateur (`Gateway Timeout`) combiné au statut Coolify
`Restarting` indique que le proxy ne dispose pas d'un conteneur `app` stable vers
lequel router. Le problème prioritaire n'est pas le catalogue de modules : c'est la
stabilité du process applicatif et de ses probes.

La cause la plus probable dans le code était l'usage de `/api/health` comme sonde
Docker alors que cette route faisait une requête PostgreSQL. Une healthcheck Docker
doit vérifier la vie du process applicatif, pas la disponibilité complète de ses
dépendances. Si PostgreSQL répond lentement, le conteneur peut être déclaré unhealthy
et redémarré, ce qui entretient les timeouts proxy.

Correction appliquée :

- `/api/health` devient une liveness probe légère, sans appel PostgreSQL.
- `/api/ready` devient la readiness probe qui vérifie PostgreSQL.
- Le `Dockerfile` garde la healthcheck sur `/api/health`.

## Flux réseau attendu

```text
Internet
   |
   v
Coolify proxy / TLS
   |
   v
app:3000  -- internal backend --> postgres:5432
   |
   +---- internal backend ----> minio:9000
```

PostgreSQL et MinIO ne doivent pas publier de ports publics. Le proxy public doit
joindre uniquement le service `app` sur le port conteneur `3000`.

## Points de contrôle

### 1. Santé applicative

- `GET /api/health` doit retourner `200 {"status":"ok"}` même si PostgreSQL est
  momentanément indisponible.
- `GET /api/ready` doit retourner `200` seulement si PostgreSQL répond.
- La healthcheck Docker doit pointer vers `/api/health`, pas `/api/ready`.

### 2. Démarrage

- `migrate` est un service one-shot obligatoire : s'il échoue, l'app ne doit pas
  démarrer sur un schéma incompatible.
- La seed de démonstration ne doit pas être une dépendance de démarrage de `app`.
  Elle doit rester une action opérateur relançable.
- `app` ne doit pas exécuter de migration ni de seed dans son `CMD`.

### 3. Timeouts proxy

Si Coolify affiche encore `Restarting` après ce correctif, inspecter dans cet ordre :

1. logs du conteneur `app` : crash Node, variable d'environnement manquante,
   exception au démarrage ;
2. logs du service `migrate` : migration Prisma en échec ;
3. état `postgres` : healthcheck `pg_isready`, volume plein, mot de passe modifié ;
4. limites mémoire : OOM kill éventuel du conteneur `app` ou `postgres` ;
5. routage Coolify : domaine attaché au mauvais service ou mauvais port.

Commandes utiles sur le VPS :

```bash
docker compose ps
docker compose logs --tail=200 app
docker compose logs --tail=200 migrate
docker compose exec app wget -qO- http://127.0.0.1:3000/api/health
docker compose exec app wget -qO- http://127.0.0.1:3000/api/ready
```

## Modules et scalabilité

Les modules ne doivent pas être hardcodés dans l'application. La source de vérité
est PostgreSQL :

- `Module` : identité stable et slug ;
- `ModuleVersion` : brouillon/publié/archivé, titre, résumé, classification ;
- `ModuleBlock` : blocs ordonnés typés, validés par le registre Zod ;
- `ModuleSearchDocument` : document dénormalisé pour catalogue/recherche.

La seed de démonstration est acceptable uniquement comme initialisation de données
pour un environnement de test. Elle doit utiliser les mêmes services de domaine que
l'autorat normal et ne doit pas remplacer l'éditeur `/admin`.

Pour passer à l'échelle :

- garder la pagination et les facettes côté catalogue ;
- conserver la recherche derrière `SearchPort` pour pouvoir remplacer PostgreSQL FTS
  par un moteur externe si le besoin réel apparaît ;
- construire le document de recherche au moment de la publication, pas à la requête ;
- ajouter l'éditeur admin pour que la création de cours soit data-driven et non
  dépendante d'un commit.

## Décision

Le site doit rester un monolithe modulaire scalable sur VPS :

- domaine découplé de Next.js ;
- ports pour recherche, média et future IA ;
- contenu publié immuable ;
- migrations one-shot ;
- probes liveness/readiness séparées ;
- pas de contenu de cours hardcodé dans les pages ou composants.
