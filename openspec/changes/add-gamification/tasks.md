## 1. Gamification Domain And Data Model

- [x] 1.1 Add `point_event` (idempotent on learner + kind + source) and `learner_score` tables, and a learner leaderboard opt-in field, with a Prisma migration and learner-cascade deletion
- [x] 1.2 Implement the pure-domain `src/modules/gamification` rule registry (action kind → points + rule version) and ordered level thresholds, with no framework imports
- [x] 1.3 Add unit tests for point values, level derivation across thresholds, and rule/threshold edge cases

## 2. Awarding And Aggregation

- [x] 2.1 Award points transactionally when a quiz attempt is scored, a module is completed, and a dilemma is voted, linking each award to its source record and module version
- [x] 2.2 Enforce idempotency so retried or duplicated actions award points only once, and update the `learner_score` aggregate in the same transaction
- [x] 2.3 Implement a `recompute` command (with optional `--backfill`) that rebuilds aggregates from recorded events
- [x] 2.4 Add integration tests for awarding, idempotency, aggregate consistency, and recompute equivalence

## 3. Learner Surfaces

- [x] 3.1 Show the points total and level in the personal space, with an accessible status message on change
- [x] 3.2 Build an explainable points history (each award: reason, points, related module)
- [x] 3.3 Add an accessible, keyboard-operable leaderboard opt-in/opt-out control defaulting to off

## 4. Leaderboard

- [x] 4.1 Build the opt-in, pseudonymous leaderboard reading the score aggregate (display name, level, points), excluding non-participants and deleted/anonymized learners
- [x] 4.2 Render the leaderboard as an accessible data table (caption, `th scope`, rank as text not colour) with pagination and deterministic tie-breaking
- [x] 4.3 Add Playwright coverage for opt-in/opt-out, exclusion of non-participants, no email exposure, and keyboard/table-semantics operation

## 5. Privacy, Integrity And Release

- [x] 5.1 Verify account deletion removes/anonymizes point events and the score aggregate and drops the learner from the leaderboard
- [x] 5.2 Run an RGAA check on the leaderboard and personal-space additions (table semantics, non-color-only rank, status messages, keyboard) and record results
- [x] 5.3 Run the full automated suite and production build, and document the awarding rules, level curve, and the recompute/backfill operation
