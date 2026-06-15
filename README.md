# MEPA — plateforme pédagogique sur l'éthique de l'IA

Monolithe modulaire Next.js (App Router, TypeScript) avec identités apprenant/équipe
séparées, modules composés de blocs typés et versionnés, stockage média S3, frontière
IA neutre (désactivée par défaut) et déploiement Docker Compose sur un seul VPS.

Ce service est **indépendant** : il s'inspire des principes d'ergonomie et
d'accessibilité DSFR/RGAA sans utiliser les identités graphiques réservées de l'État
ni se présenter comme un service officiel.

## Architecture

```
src/
  app/                     Next.js App Router (pages, /api/health)
  modules/
    identity/              crypto partagée (Argon2id, jetons de session)
    authoring/             domaine modules + registre de blocs typés
      blocks/              schémas Zod, registre, projections texte
      module-service.ts    brouillon transactionnel + publication immuable
    learning/              scoring quiz, progression
    media/                 MediaStoragePort + adaptateur S3/MinIO
    ai-boundary/           contrats neutres tuteur + constructeur de contexte
  shared/
    config/env.ts          validation d'environnement (Zod)
    db/prisma.ts           client Prisma singleton (adapter-pg)
prisma/schema.prisma       schéma PostgreSQL complet
```

**Règles de frontière** (vérifiées par `npm run arch:check`) : le code de domaine
n'importe jamais Next.js, et les fichiers de domaine pur n'importent jamais le client
Prisma concret (il est injecté).

## Développement local

```bash
cp .env.example .env            # renseigner les valeurs locales
docker compose -f docker-compose.dev.yaml up -d   # PostgreSQL + MinIO + bucket
npm install
npx prisma migrate dev          # crée la base et applique les migrations
npm run db:seed                 # module d'exemple publié
npm run dev                     # http://localhost:3000
```

L’espace équipe n’est jamais annoncé dans l’interface publique. Les membres de
l’équipe se connectent directement sur `http://localhost:3000/admin/sign-in`; après
authentification, le lien « Espace équipe » apparaît dans leur navigation.

Qualité :

```bash
npm run arch:check   # frontières d'architecture
npm run lint
npm run typecheck
npm test             # tests unitaires + intégration (Vitest)
npm run test:e2e     # Playwright (app démarrée requise)
npm run build        # build de production (sortie standalone)
```

## Déploiement production avec Coolify

La stack [`compose.yaml`](compose.yaml) est conçue pour une ressource **Docker
Compose** Coolify. Coolify construit les images, crée le domaine public HTTPS grâce
à `SERVICE_FQDN_APP_3000`, conserve les volumes nommés et démarre l'application
uniquement après une migration Prisma réussie.

### Configuration Coolify

1. Créer une ressource **Docker Compose** depuis ce dépôt et sélectionner
   `compose.yaml`.
2. Coolify génère et conserve automatiquement `SERVICE_PASSWORD_POSTGRES`,
   `SERVICE_USER_MINIO` et `SERVICE_PASSWORD_MINIO`.
3. Dans **Domains for app**, renseigner le domaine public, par exemple
   `https://mepa.ipv6-sigl.fr`. Laisser les domaines des autres services vides.
4. Déployer. Le service `migrate` doit terminer avec le code 0 avant le démarrage
   de `app`.

PostgreSQL et MinIO ne publient aucun port. Le proxy Coolify accède uniquement à
l'application sur son port conteneur `3000`; TLS est géré par Coolify.

### Vérification

```bash
curl -fsS https://votre-domaine.example/api/health
# {"status":"ok","db":"up"}
```

Si `migrate` échoue, Coolify ne démarre pas `app`. Corriger la migration
(rétrocompatible, expand-and-contract), puis relancer le déploiement.

### Rollback

- Conserver le tag d'image précédent et une sauvegarde de base récente.
- Migration rétrocompatible → redéployer l'image précédente (`APP_TAG=...`).
- Migration non rétrocompatible → restaurer la base et le stockage objet
  correspondants **avant** de démarrer l'image précédente.

## Sauvegardes et restauration

Le service `backup` réalise périodiquement :

- un dump logique PostgreSQL (`pg_dump | gzip`) dans le volume `backup_data` ;
- un miroir du bucket MinIO ;
- une purge selon `BACKUP_RETENTION_DAYS`.

> Les sauvegardes locales ne suffisent pas. **Copier régulièrement `/backups` hors
> du VPS** (rsync/objet distant) et réaliser un exercice de restauration.

### Exercice de restauration (restore drill)

```bash
# Base
gunzip -c backups/postgres/db-<ts>.sql.gz | \
  docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

# Médias
docker compose run --rm --entrypoint sh minio-init -c \
  "mc alias set bk http://minio:9000 $S3_ACCESS_KEY_ID $S3_SECRET_ACCESS_KEY && \
   mc mirror --overwrite /backups/minio/$S3_BUCKET bk/$S3_BUCKET"
```

Vérifier ensuite que comptes, modules, progression et médias sont présents.

## Persistance et réseau

- Volumes nommés : `postgres_data`, `minio_data`, `backup_data` — indépendants des
  conteneurs ; recréer les conteneurs ne perd aucune donnée.
- Réseau `backend` `internal: true` : PostgreSQL et MinIO ne sont pas joignables
  publiquement ; seule l'application est exposée au proxy Coolify.

## Frontière IA (future)

Aucun SDK fournisseur n'est installé et `TUTOR_ENABLED=false` par défaut : aucune UI
ni requête tuteur n'existe dans le build par défaut. Les contrats neutres
(`TutorProvider`, `ModuleContextBuilder`) et un constructeur de contexte limité au
contenu **publié** sont prêts pour une intégration ultérieure, après revue de sécurité.

## Gamification

Les points, niveaux et le classement pseudonyme facultatif sont documentés dans
[`docs/gamification.md`](docs/gamification.md). Pour vérifier ou reconstruire les
agrégats de scores :

```bash
npm run gamification:recompute
npm run gamification:recompute -- --backfill  # reprise historique explicite
```
