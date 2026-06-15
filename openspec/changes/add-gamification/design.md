## Context

The platform records learning actions today: `QuizAttempt` (with `score`/`maxScore`),
`ModuleCompletion`, and `DilemmaVote`, all tied to a published `ModuleVersion` and a
`Learner` whose email is private and whose `displayName` is a chosen pseudonym. There is
no points aggregation, level, or ranking. Gamification must build strictly on these
already-trusted, server-recorded actions, must not weaken privacy or accessibility, and
must keep domain logic free of Next.js/Prisma per the existing architecture rules.

## Goals / Non-Goals

**Goals:**

- Reward learning with points that are deterministic, server-computed, and explainable.
- Derive levels from cumulative points and surface them in the personal space.
- Offer an opt-in, pseudonymous leaderboard that exposes no private data.
- Make awarding idempotent and recomputable so totals are always trustworthy.
- Keep scoring rules versioned and changeable without a schema migration.

**Non-Goals:**

- Badges, streaks, live updates, social features, external/monetary rewards.
- A staff UI to edit rules (rules live in code/config for this change).
- Any public exposure of identity beyond the opt-in display name.
- Trusting any client-supplied points or feeding points to the AI tutor.

## Decisions

### Award points from server-recorded actions only, idempotently

Points are never sent by the client. They are awarded inside the same transaction that
records a learning action (quiz scored, module completed, dilemma voted). Each award is
a `PointEvent` keyed by `(learnerId, kind, sourceId)` with a unique constraint, where
`sourceId` is the originating record (attempt/completion/vote id). Re-recording or
retrying therefore never double-awards. Every event references the `moduleVersionId`
used, consistent with the existing version-linked progress model.

A rejected alternative — recomputing a live total by scanning events on every read —
was kept only as the integrity/recompute path, not the hot path (see aggregate below).

### Maintain a `LearnerScore` aggregate for fast, fair ranking

A `LearnerScore` row per learner holds `totalPoints`, derived `level`, `firstReachedAt`
(for tie-breaking), and `leaderboardOptIn`. It is updated in the awarding transaction.
The leaderboard reads the aggregate (indexed by points) instead of summing events,
keeping ranking queries cheap. A `recompute` command rebuilds aggregates from
`PointEvent` to guarantee they match the source of truth.

### Versioned point-rule registry and level thresholds in the domain

A pure-domain registry (mirroring the block registry pattern) maps an action `kind` to a
points value and a `ruleVersion`; level thresholds are an ordered, named table in the
same module. Both live under `src/modules/gamification` with no framework imports, so
rules can change in code without a database migration and are unit-testable in isolation.
The stored `PointEvent.points` is the value awarded at the time (history stays accurate
even if rules later change); `recompute` uses the current rules deliberately and is an
explicit, audited operation.

### Opt-in, pseudonymous leaderboard

The leaderboard is off by default (`leaderboardOptIn = false`). A learner enables it
from their personal space and can disable it at any time, which removes them from the
ranking immediately. The leaderboard shows only `displayName`, level, and points — never
the email, never another identifier. Soft-deleted/anonymized learners are excluded.
A public, all-users-by-default board was rejected as incompatible with the platform's
privacy posture and the general-public audience.

### Accessibility as a first-class requirement

The leaderboard is a real data table (`<table>` with `<th scope>`, caption), bringing
RGAA theme 5 into scope. Rank is never conveyed by colour alone (numeric rank + text).
Points/level changes in the personal space are announced through a status message
region. The opt-in control is a labelled, keyboard-operable form.

### Privacy and integrity

On account deletion/anonymization, `PointEvent` and `LearnerScore` are removed via
cascade (matching the existing `Learner` relations). Because every point is backed by a
recorded action and awarding is idempotent, the `recompute` command can rebuild all
aggregates deterministically for audits or after a rule migration.

## Risks / Trade-offs

- [Aggregate drifts from events] -> single awarding transaction updates both; a
  `recompute` command and an optional integrity test rebuild and compare.
- [Gamification pressure harms a learning/ethics mission] -> modest, learning-only point
  sources; leaderboard opt-in; no streaks or loss-aversion mechanics.
- [Leaderboard leaks or enables identification] -> opt-in, pseudonym-only projection,
  exclude deleted/anonymized, never expose email or stable ids beyond display name.
- [Rule changes rewrite history] -> store awarded points on each event; treat
  `recompute` as an explicit, documented operation.
- [Gaming via repeated actions] -> idempotent `(learner, kind, sourceId)` awards; points
  only from version-linked, server-recorded actions.

## Migration Plan

1. Add `point_event` and `learner_score` tables and the learner opt-in field via an
   expand-only migration (no backfill required; pre-existing actions award no
   retroactive points unless `recompute --backfill` is explicitly run).
2. Deploy awarding hooks; new actions begin awarding points.
3. (Optional) Run `recompute --backfill` once to grant points for historical actions.
4. Ship the personal-space summary, then the opt-in control and leaderboard.

Rollback: the feature is additive; disabling the leaderboard route and awarding hooks
leaves recorded learning actions intact. Tables can be dropped in a later contract
migration if the feature is removed.

## Resolved Decisions

- **Leaderboard scope**: global all-time only for this change. Per-period (monthly) and
  per-module rankings are explicitly deferred to a later extension.
- **Mechanics scope**: points + levels + opt-in leaderboard only. Badges/achievements and
  streaks are out of scope for this change (later extension).
- **Backfill**: ship without retroactive points; `recompute --backfill` remains available
  as an explicit operator action.

## Open Questions

- Level curve and per-action point values: the defaults below are starting points to
  validate with the product owner; they live in code and can change without a migration.
  - MODULE_COMPLETED: 50 · QUIZ_PASSED: 20 · QUIZ_FIRST_TRY_BONUS: +10 · DILEMMA_VOTED: 5
  - Levels (cumulative): 1:0, 2:100, 3:250, 4:500, 5:1000, then +750 per level.
