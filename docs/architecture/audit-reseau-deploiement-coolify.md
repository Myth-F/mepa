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

## Audit VPS du 2026-06-17

Constats sur `ovh-vps` :

- `app-wrlkudl8s4joiy7n6sy4qgmh-*`, `postgres-*` et `minio-*` étaient `healthy`.
- `https://mepa.ipv6-sigl.fr/api/health` et `/api/ready` répondaient en `200`.
- L'appel direct depuis le réseau Docker vers `app:3000/api/health` répondait en
  quelques millisecondes.
- Le service Coolify affiché comme `Restarting` était `backup-*`, pas `app-*`.
- Dans le conteneur déployé, `/usr/local/bin/backup.sh` était un répertoire. Cela
  indique un bind mount de fichier dont la source n'existait pas côté hôte Coolify.
- Des timeouts intermittents ont été reproduits vers Traefik alors que l'appel direct
  à l'app était sain.
- Traefik émettait beaucoup d'erreurs non liées à MEPA : rate limit Let's Encrypt sur
  `adminer-project.myth2logics.dev` et service `api-v8o4...` sans port.
- Un autre conteneur Coolify (`presenton.ipv6-sigl.fr`) consommait fortement le CPU et
  redémarrait ses processus internes à cause d'une configuration `LLM_PROVIDER`
  manquante.

Correction appliquée côté MEPA :

- Le script de backup n'est plus monté depuis un chemin hôte Coolify.
- Le `Dockerfile` construit une cible `backup` dédiée qui embarque
  `scripts/backup.sh`.
- `compose.yaml` utilise cette image de backup et conserve seulement le volume
  persistant `/backups`.

Actions opérateur recommandées après déploiement :

1. Redéployer MEPA pour recréer le service `backup` avec l'image dédiée.
2. Vérifier que `docker inspect backup-*` indique
   `entrypoint=["/bin/sh","/usr/local/bin/backup.sh"]` et que le conteneur reste
   `Up`, plus `Restarting`.
3. Corriger ou arrêter temporairement `presenton.ipv6-sigl.fr` tant que
   `LLM_PROVIDER` n'est pas configuré.
4. Corriger le projet `v8o4...` qui expose un service Traefik sans port.
5. Résoudre le rate limit Let's Encrypt du domaine `adminer-project.myth2logics.dev`
   ou désactiver ce routeur si le service n'est pas utilisé.
