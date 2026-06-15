## Why

The task-allocation plan assigns a dedicated "Gamification (leaderboard, options, point
calculation)" workstream, but it is absent from the current platform and from the
existing OpenSpec change. Learners progress through modules with no visible reward,
which weakens motivation and retention for a general-public audience. We want to add
points, levels, and an optional ranking that reinforce learning — while preserving the
platform's privacy-first stance (email never exposed), accessibility targets (RGAA),
and the provider-neutral modular monolith.

## What Changes

- Introduce a deterministic, server-side **points** model: learning actions recorded
  against a published module version (module completion, quiz success, first-attempt
  bonus, ethical-dilemma participation) award points exactly once (idempotent).
- Introduce **levels** derived from cumulative points, shown in the learner's space.
- Introduce an **opt-in, pseudonymous leaderboard**: off by default, shows only the
  learner's chosen display name and never the email address; the learner controls their
  visibility and can leave at any time.
- Introduce a **points history / breakdown** in the personal space so each award is
  explainable.
- Introduce a **points rule registry** and **level thresholds** as versioned,
  code-level configuration, so the scoring can evolve without a database migration.
- Ensure gamification data is **removed or anonymized on account deletion** (RGPD) and
  can be **recomputed** from recorded learning actions for integrity.

Non-goals for this change: badges/achievements, streaks, real-time/live leaderboard
updates, social features (following, sharing), monetary or external rewards, a
staff-facing UI to edit point rules, any public exposure of identity beyond the
opt-in display name, and feeding points into the future AI tutor.

## Capabilities

### New Capabilities

- `gamification`: Server-computed points and levels for learning actions, an opt-in
  pseudonymous leaderboard, an explainable points history, and privacy-respecting
  deletion and recomputation.

### Modified Capabilities

- `learner-experience`: The personal space gains a points/level summary and a
  leaderboard opt-in control. Recording a quiz attempt, a module completion, or a
  dilemma vote also awards the corresponding points in the same transaction. (No change
  to what learners may access or to published-only consumption.)

## Impact

Adds new tables (`point_event`, `learner_score`) and a learner opt-in field, a
`gamification` module (`src/modules/gamification`) with a pure-domain rule registry and
level thresholds, awarding hooks in the learning use cases, a leaderboard page, and
profile UI. No new runtime dependency. Accessibility scope grows to include a data
table (RGAA theme 5) for the leaderboard. No change to the staff, media, deployment, or
AI-boundary capabilities.
