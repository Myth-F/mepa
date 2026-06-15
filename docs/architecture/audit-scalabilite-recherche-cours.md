# Audit de scalabilité — découverte et recherche des cours

> Date : 2026-06-10 · Périmètre : catalogue `/modules`, modèle d'autorat, recherche.
> Objectif : répondre à « comment ajoute-t-on des cours, par qui, et que se passe-t-il
> à 1000+ cours ? Faut-il une barre de recherche, et sur quels critères ? »

## 1. État actuel (constaté dans le code)

### 1.1 Comment ajoute-t-on un cours, et par qui ?

- Le domaine d'autorat existe : `ModuleService.createModule` → version brouillon →
  `setDraftBlocks` (validés par le registre de blocs) → `publish` (transactionnel ;
  archive la version publiée précédente ; la nouvelle version devient immuable).
- **Acteur prévu** : personnel `ADMIN`/`EDITOR` (identité séparée des apprenants).
- **Réalité aujourd'hui** : l'**interface `/admin` de création/édition n'est pas encore
  construite** (tâches 3.1/3.2 du bootstrap en attente). Un cours ne peut donc être ajouté
  que par **script de seed ou appel programmatique** au `ModuleService`. Il n'y a pas
  encore de self-service éditeur, ni d'import en masse, ni de workflow de relecture.

### 1.2 Comment sont listés les cours ?

```ts
prisma.moduleVersion.findMany({
  where: { status: "PUBLISHED" },
  orderBy: { publishedAt: "desc" },
  include: { module: true },
});
```

- **Aucune pagination** (`take`/`skip`/cursor absents) : la requête charge **toutes** les
  versions publiées.
- **Aucune recherche, aucun filtre, aucune catégorie.**
- Page en `force-dynamic` : **aucun cache**, tout est recalculé et re-rendu à chaque visite.

### 1.3 Modèle de données

- `Module{slug}`, `ModuleVersion{title, summary, status, publishedAt}`. **Pas** de catégorie,
  tag, niveau de difficulté, durée estimée, langue, ni mots-clés.
- Index présents : `@@unique([moduleId, versionNumber])`, `@@index([status])`.
  **Pas d'index sur `publishedAt`** (le tri se fait sans index dédié).
- Le **texte du corps** des cours est déjà projetable en texte normalisé via
  `projectBlockText` du registre de blocs (utilisé pour la frontière IA) — atout réutilisable
  pour la recherche.

## 2. Ce qui casse à 1000+ cours

| Domaine | Problème à l'échelle |
|---|---|
| **Transfert / rendu** | 1000+ `<article>` générés à chaque requête (`force-dynamic`) → HTML massif, TTFB/LCP dégradés, mémoire serveur. C'est le **premier mur**, atteint bien avant la limite SQL. |
| **Base de données** | `findMany` sans `take` rapatrie toutes les lignes ; tri `publishedAt` **sans index** → tri à chaque requête. Tolérable à 1k, coûteux et inutile puisqu'on n'affiche pas tout. |
| **UX / découverte** | Une liste plate de 1000 items est **inutilisable** : impossible de trouver un sujet précis. C'est le vrai problème métier. |
| **Pas de recherche** | Aucun moyen de chercher par mot-clé, ni de filtrer par thème/niveau. |
| **Autorat** | Sans UI d'édition ni catégorisation, créer et organiser 1000 cours est ingérable. |

## 3. Faut-il une barre de recherche ? Sur quels critères ?

**Oui — mais la recherche plein-texte n'est pas le besoin principal.** À 1000 cours, le
**parcours par facettes** (catégories/thèmes, niveau, durée) compte autant, voire plus,
que la recherche libre. Il faut les deux : **filtres + recherche + pagination**.

### Critères de recherche recommandés (par ordre de poids)

1. **Titre** (poids fort)
2. **Résumé** (poids moyen)
3. **Corps du cours** : texte projeté des blocs via `projectBlockText` (poids faible)
4. **Catégorie / tags / sources** (à ajouter au modèle)

Recherche **insensible à la casse et aux accents** (français), avec **racinisation**
(stemming) et un **classement par pertinence** (`ts_rank` pondéré), optionnellement boosté
par un signal de **popularité** (nombre de complétions).

## 4. Stratégie de mise à l'échelle (par phases, single-VPS d'abord)

L'architecture impose un **monolithe modulaire sur un seul VPS** : on privilégie
PostgreSQL avant d'ajouter un service externe.

### Phase 1 — Indispensable, peu coûteux (débloque tout de suite)

- **Pagination** : remplacer le `findMany` global par une pagination **keyset/cursor**
  (`(publishedAt, id)`), plus stable que `OFFSET` en pages profondes.
- **Index** : `@@index([status, publishedAt])` pour lister/paginer efficacement.
- **Taxonomie** : ajouter `Category` (et/ou `Tag`), `level`, `estimatedMinutes`, `language`
  au modèle, pour des **filtres à facettes** et une page « Table des cours » organisée.
- **Cache** : passer le catalogue en rendu mis en cache + revalidation (ISR) plutôt que
  `force-dynamic`, le contenu publié changeant rarement.

### Phase 2 — Recherche plein-texte PostgreSQL (cible recommandée)

- **Document de recherche construit à la publication** (on contrôle déjà `publish`) :
  concaténer titre + résumé + `projectBlockText` des blocs + tags dans un `tsvector`
  **pondéré** (A=titre, B=résumé, C=corps), stocké sur `ModuleVersion` ou une table
  `module_search` dédiée (clé = module, version publiée courante).
- **Dictionnaire `french` + `unaccent`** pour stemming et insensibilité aux accents.
- **Index GIN** sur le `tsvector` ; requêtes `to_tsquery` + tri `ts_rank`.
- Tient **plusieurs dizaines de milliers** de cours sans infrastructure supplémentaire.

### Phase 3 — Moteur externe (seulement si nécessaire)

- Si besoin de **tolérance aux fautes de frappe**, **facettes avancées**, **suggestions
  instantanées** à très grande échelle : **Meilisearch** ou **Typesense** (un service de
  plus dans le Compose VPS, donc coût d'exploitation).
- **À encapsuler derrière un `SearchPort`** (même patron que `MediaStoragePort` et la
  frontière IA), avec un **adaptateur PostgreSQL par défaut** : on peut basculer de
  moteur sans toucher l'UI du catalogue ni le domaine. Probablement **superflu** pour un
  catalogue pédagogique ; la Phase 2 suffit dans la grande majorité des cas.

## 5. Autorat à l'échelle (qui ajoute, comment)

- Construire l'**UI `/admin`** de création/édition de modules (tâches 3.1/3.2) : c'est le
  prérequis pour que des **éditeurs** ajoutent des cours en self-service.
- Ajouter la **catégorisation** au moment de l'autorat (un cours = 1 catégorie + N tags).
- Prévoir, au-delà de quelques centaines de cours : **recherche/pagination côté admin**,
  rôles de **relecture/publication**, éventuellement un **import** (CSV/JSON) pour
  l'amorçage massif.

## 6. Recommandation

1. **Maintenant** : pagination keyset + index `[status, publishedAt]` + cache ISR
   (corrige le mur de rendu, faible effort).
2. **Court terme** : taxonomie (catégories/tags/niveau/durée) + filtres à facettes + l'UI
   d'autorat — c'est ce qui rend 1000 cours réellement navigables.
3. **Recherche** : FTS PostgreSQL (Phase 2) avec document construit à la publication via
   `projectBlockText`, derrière un `SearchPort` neutre. Moteur externe seulement si un
   besoin avéré le justifie.

> À formaliser dans un change OpenSpec dédié (`add-course-discovery`) couvrant
> pagination, taxonomie, filtres à facettes et recherche FTS, avec le `SearchPort`
> provider-neutre. La recherche est déjà identifiée dans la répartition des tâches mais
> n'est pas encore spécifiée.
