## Why

The team needs a deployable technical foundation that can deliver the educational MVP quickly while making new modules simple to author and publish. The foundation must also avoid coupling the product to an AI vendor so a contextual tutor can be integrated later without redesigning the learning domain.

## What Changes

- Introduce a modular Next.js application with separate learner and staff authentication boundaries.
- Introduce a custom administration area for composing, previewing, versioning, and publishing educational modules from typed blocks.
- Introduce the learner-facing catalogue, module runner, quiz, dilemma vote, and progression tracking.
- Introduce a low-friction, DSFR-inspired public journey with plain-language navigation and no disclosure of staff-only areas to unauthenticated visitors.
- Introduce S3-compatible media storage with required accessibility metadata.
- Introduce provider-neutral contracts and module context projections for a future, disabled-by-default contextual AI tutor.
- Introduce a production-oriented Docker Compose deployment for a single VPS, including PostgreSQL, object storage, migrations, health checks, persistent volumes, secrets, and backup procedures.

Non-goals for this change are an active AI tutor, public discussions, live chat, certification, FranceConnect, and use of restricted DSFR identity assets.

## Capabilities

### New Capabilities

- `staff-module-authoring`: Staff authentication and a block-based workflow to create, preview, version, and publish educational modules.
- `learner-experience`: Learner authentication, published-module consumption, assessments, dilemma votes, and progress tracking.
- `media-management`: Accessible media upload and retrieval through S3-compatible object storage.
- `future-ai-boundary`: Provider-neutral contracts and trusted module-context construction for a future contextual tutor.
- `vps-compose-deployment`: Repeatable deployment and operation of the complete platform on a single VPS using Docker Compose.

### Modified Capabilities

None.

## Impact

This establishes the application, database schema, authentication model, content contracts, storage abstraction, test strategy, CI checks, and VPS deployment model. It adds runtime dependencies on PostgreSQL and S3-compatible storage, with MinIO used by the default Docker Compose stack.
