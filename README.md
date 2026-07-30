<div align="center">
  <img src="public/favicon.svg" alt="Iavenir logo" width="96" />
  <h1>Iavenir</h1>
  <p><strong>An educational platform for understanding the ethical challenges of artificial intelligence.</strong></p>

  <p>
    <a href="https://github.com/Myth-F/mepa"><img alt="GitHub" src="https://img.shields.io/badge/GitHub-Myth--F%2Fmepa-181717?logo=github" /></a>
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
    <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" />
    <img alt="Docker" src="https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white" />
  </p>

  <p>
    <a href="#quick-start">Quick start</a>
    ·
    <a href="#architecture">Architecture</a>
    ·
    <a href="#quality">Quality</a>
    ·
    <a href="docs/gamification.md">Gamification</a>
  </p>
</div>

---

## About

Iavenir is a web application for learning about AI ethics. It provides versioned educational modules, quizzes, progress tracking, and optional gamification. A separate staff area supports platform administration.

The project draws inspiration from DSFR and RGAA usability and accessibility principles. It does not use restricted French government branding and is not presented as an official public service.

## Features

- educational modules built from typed content blocks;
- immutable, versioned publication workflow;
- separate learner and staff identities;
- quizzes, progress tracking, points, levels, and an opt-in leaderboard;
- S3-compatible media storage through MinIO;
- health and readiness probes for production operations;
- built-in PostgreSQL and MinIO backups;
- provider-neutral boundary for a future AI tutor, disabled by default.

## Tech stack

| Area | Technologies |
| --- | --- |
| Application | Next.js 16, React 19, TypeScript |
| Data | PostgreSQL, Prisma |
| Media | S3 / MinIO |
| Validation and security | Zod, Argon2id |
| Testing | Vitest, Playwright, axe-core |
| Deployment | Docker Compose, Coolify |

## Quick start

### Requirements

- Node.js 22 or newer;
- Docker and Docker Compose;
- npm.

### Installation

```bash
git clone https://github.com/Myth-F/mepa.git
cd mepa
cp .env.example .env
docker compose -f docker-compose.dev.yaml up -d
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

The application is available at [http://localhost:3000](http://localhost:3000).

The demo seed is safe to run multiple times. It creates categories, published modules, sources, learner accounts, and progress data.

### Demo accounts

| Area | Email | Password |
| --- | --- | --- |
| Staff | `editor@example.org` | `change-me-please` |
| Learner | `camille.apprenante@example.org` | `change-me-please` |
| Learner | `nour.apprenante@example.org` | `change-me-please` |
| Learner | `leo.apprenant@example.org` | `change-me-please` |

The staff sign-in page is available at `/admin/sign-in`. These credentials are for local development only.

## Architecture

```text
src/
├── app/                 # Next.js pages and API routes
├── modules/
│   ├── identity/        # Identities, sessions, and cryptography
│   ├── authoring/       # Modules, blocks, and publication
│   ├── learning/        # Quizzes, scores, and progress
│   ├── media/           # Storage port and S3 adapter
│   └── ai-boundary/     # Provider-neutral tutor contracts
└── shared/
    ├── config/          # Environment validation
    ├── db/              # Prisma client
    └── ui/              # Shared UI components

prisma/                  # Schema, migrations, and seed
scripts/                 # Administration and maintenance
tests/                   # Shared test setup
docs/                    # Extended documentation
```

Architecture boundaries are enforced by `npm run arch:check`: domain code does not import Next.js, and pure domain files do not depend directly on the concrete Prisma client.

## Configuration

Copy `.env.example` to `.env`, then configure:

- `DATABASE_URL` for PostgreSQL;
- `APP_URL` and session settings;
- `EMAIL_WEBHOOK_*` for transactional email;
- `S3_*` for object storage.

Never commit `.env` or real credentials. The tutor remains disabled with `TUTOR_ENABLED=false`.

## Quality

```bash
npm run arch:check     # Check architecture boundaries
npm run lint           # Run static analysis
npm run typecheck      # Check TypeScript types
npm test               # Run Vitest
npm run test:e2e       # Run Playwright; the app must be running
npm run build          # Create a production build
```

## Administration

Create or reset a staff account:

```bash
npm run staff:upsert -- \
  --email editor@example.org \
  --name "Editor" \
  --password 'change-me-please' \
  --role EDITOR
```

Rebuild derived data:

```bash
npm run gamification:recompute
npm run search:recompute
```

Points, levels, and leaderboard behavior are documented in [`docs/gamification.md`](docs/gamification.md).

## Deployment

[`compose.yaml`](compose.yaml) is designed for a Coolify Docker Compose resource. It orchestrates:

- PostgreSQL and MinIO on an internal network;
- Prisma migrations before application startup;
- the Next.js application on port `3000`;
- scheduled database and media backups.

After deployment, verify both probes:

```bash
curl -fsS https://your-domain.example/api/health
curl -fsS https://your-domain.example/api/ready
```

Backups stored in `backup_data` should be copied off the VPS regularly and tested through restore drills.

## Project status

The learner experience, publishing workflow, progress tracking, and operational foundations are implemented. The visual module builder and any future AI tutor integration remain planned improvements.
