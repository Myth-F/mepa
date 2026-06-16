## 1. Foundation And Local Stack

- [x] 1.1 Initialize the Next.js App Router TypeScript project with strict type checking, linting, formatting, unit tests, Playwright, and Next.js standalone output
- [x] 1.2 Create the modular `src/modules` structure, dependency-boundary conventions, shared UI foundation, and architecture checks
- [x] 1.3 Add Prisma and the initial PostgreSQL schema for separate learner/staff identities, sessions, modules, versions, blocks, media, progress, attempts, and votes
- [x] 1.4 Add local Docker Compose services for PostgreSQL and MinIO with health checks, named volumes, bucket initialization, and documented environment variables
- [x] 1.5 Add CI checks for lint, TypeScript, unit tests, integration tests, Prisma migration validation, and production build

## 2. Staff Authentication And Module Domain

- [x] 2.1 Implement shared Argon2id and hashed-session utilities while keeping staff and learner repositories, cookies, and policies separate
- [x] 2.2 Implement staff sign-in, sign-out, route protection, role authorization, conditional navigation, and one-shot initial administrator creation
- [x] 2.3 Implement module, version, and block domain models with transactional draft creation and immutable publication rules
- [x] 2.4 Implement the versioned block registry with Zod schemas, learner renderers, admin editors, and text projections for initial block types
- [x] 2.5 Add unit and integration tests for identity isolation, block validation, publication transitions, and published-version immutability
- [x] 2.6 Allow active staff accounts to sign into the public learner space through a separate learner session without granting staff access

## 3. Administration And Media

- [x] 3.1 Build accessible `/admin` module list, create, metadata edit, and draft management screens
- [x] 3.2 Build the typed block editor with add, edit, remove, reorder, and actionable validation errors
- [~] 3.3 Implement the `MediaStoragePort`, MinIO adapter, signed upload flow, media validation, and alternative-text metadata (port + S3/MinIO adapter + validation + alt-text rules done; HTTP signed-upload route + MediaAsset persistence pending)
- [x] 3.4 Build learner-view preview, complete-draft validation, publication, and version-history screens
- [~] 3.5 Add Playwright coverage for staff access denial, module creation, invalid publication, valid publication, preview, and draft-only media protection (staff access denial, creation, valid publication and preview covered; invalid publication + draft-only media protection pending)
- [x] 3.6 Verify that module creation and editing never require repository changes: public pages must read only published database/search-document content, while seed content remains a non-runtime demo initializer

## 4. Learner Experience

- [x] 4.1 Implement learner registration, sign-in, sign-out, profile, session management, and account deletion
- [x] 4.2 Build the accessible published-module catalogue and ordered block rendering experience
- [x] 4.3 Implement quiz attempts, scoring, module completion, progression display, and version-linked history
- [x] 4.4 Implement ethical dilemma voting with one vote per learner and published dilemma version
- [ ] 4.5 Add integration and Playwright tests for published-only access, keyboard operation, quiz scoring, progress, duplicate-vote prevention, and account deletion
- [x] 4.6 Build the full-width "classroom" module reader: progress rail (accessible progress bar + step navigation with scroll tracking), centred reading column, and a reserved assistant column rendered only via the AI boundary (inert, no input/request in the default build)

## 5. Future AI Boundary

- [x] 5.1 Define provider-neutral `TutorProvider`, `TutorRequest`, `TutorResponse`, `ModuleContextBuilder`, and source-reference contracts
- [x] 5.2 Implement trusted context construction from published versions using registered block text projections and configurable limits
- [x] 5.3 Add a disabled-by-default tutor feature flag and a fake provider used only by contract tests
- [x] 5.4 Verify no vendor AI SDK or active tutor UI/provider request exists in the default build

## 6. Production Docker Compose And VPS Operations

- [x] 6.1 Create a pinned multi-stage non-root application Dockerfile with a health endpoint and production-safe startup command
- [x] 6.2 Create production `compose.yaml` services for app, PostgreSQL, MinIO, bucket initialization, one-shot migrations, and scheduled backups
- [x] 6.3 Configure internal networks, loopback-only application exposure, health-gated dependencies, restart policies, log rotation, resource-conscious defaults, and persistent volumes
- [x] 6.4 Add `.env.example`, secret-generation guidance, reverse-proxy/TLS guidance, firewall expectations, image tagging, and deployment/rollback commands
- [x] 6.5 Implement PostgreSQL dump and MinIO mirror backup jobs with retention, and document required off-host backup copying
- [~] 6.6 Perform and document a clean Compose deployment test, container-recreation persistence test, failed-migration test, backup test, and full restore drill (procedures documented in README runbook; execution requires a Docker host — not run in this environment)
- [x] 6.7 Split application liveness (`/api/health`, no dependency calls) from readiness (`/api/ready`, PostgreSQL check) so dependency slowness does not cause Docker/Coolify restart loops
- [ ] 6.8 Validate Coolify deployment logs after rollout: app container remains running, `/api/health` returns 200, `/api/ready` returns 200, and proxy no longer reports recurring gateway timeouts

## 7. MVP Content And Release Verification

- [ ] 7.1 Create the initial three sourced modules through the administration interface and verify their publication history
- [~] 7.2 Run accessibility checks covering keyboard navigation, focus, labels, validation messages, alternative text, and non-color-only indicators (RGAA 4.1 design audit over the 106 criteria recorded in `docs/accessibilite/audit-rgaa-4-1.md`, ≈97% on applicable criteria; fixed 11.10/11.11 error-to-field association on the auth/registration forms; remaining: tooled campaign with NVDA/VoiceOver + axe + zoom/reflow, and account-deletion confirmation 11.12)
- [~] 7.3 Run the complete automated test suite and production build against the Docker Compose stack (lint, typecheck, unit tests and production build pass locally; full Docker Compose execution requires a Docker host)
- [ ] 7.4 Deploy the release candidate to the VPS staging environment, verify public application health through TLS, and record the release and recovery runbook
