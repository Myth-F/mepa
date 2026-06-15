## ADDED Requirements

### Requirement: Points are awarded deterministically and only once per action
The system SHALL award points server-side for learning actions recorded against a
published module version, using a versioned rule registry, and SHALL never award the
same action twice.

#### Scenario: Learner passes a quiz
- **WHEN** a learner's quiz attempt is recorded as passed for a published version
- **THEN** the system awards the configured points in the same transaction and links the
  award to that attempt and module version

#### Scenario: The same action is recorded again
- **WHEN** the same learning action (same learner, kind, and source record) is submitted
  or retried more than once
- **THEN** the system awards its points only once and the learner's total is unchanged on
  the repeat

#### Scenario: Client submits points directly
- **WHEN** a request attempts to set or add points without a corresponding server-recorded
  action
- **THEN** the system ignores it and no points are granted

### Requirement: Learner level is derived from cumulative points
The system SHALL compute a learner's level from their cumulative points using ordered
thresholds and SHALL keep the displayed total and level consistent with awarded events.

#### Scenario: Crossing a level threshold
- **WHEN** an award raises a learner's cumulative points past the next threshold
- **THEN** the system reflects the new level wherever the level is shown

#### Scenario: Totals are recomputed
- **WHEN** an operator recomputes scores from recorded point events
- **THEN** each learner's stored total and level equal the values derived from their events

### Requirement: The leaderboard is opt-in and pseudonymous
The system SHALL exclude every learner from the leaderboard by default, SHALL include a
learner only after an explicit opt-in, and SHALL expose only the learner's chosen display
name, level, and points — never the email address or any other identifier.

#### Scenario: Default visibility
- **WHEN** a learner has never opted in
- **THEN** the learner does not appear in the leaderboard

#### Scenario: Learner opts in then opts out
- **WHEN** a learner enables leaderboard participation and later disables it
- **THEN** the learner appears while enabled and is removed immediately when disabled

#### Scenario: Deleted account is excluded
- **WHEN** a learner's account is deleted or anonymized
- **THEN** the learner no longer appears in the leaderboard and their email is never shown

### Requirement: Points are explainable to the learner
The system SHALL let a learner view a breakdown of how their points were earned.

#### Scenario: Learner reviews their history
- **WHEN** a learner opens their points history
- **THEN** the system lists each award with its reason, points, and the related module

### Requirement: Gamification surfaces are accessible
The system SHALL present the leaderboard as a data table with header cells and a caption,
SHALL not convey rank by colour alone, SHALL make points and level changes available to
assistive technologies, and SHALL keep all gamification controls keyboard-operable.

#### Scenario: Leaderboard read with assistive technology
- **WHEN** a user navigates the leaderboard with a keyboard and a screen reader
- **THEN** ranks, names, levels, and points are reachable, associated with their column
  headers, and rank is available as text (not colour only)

### Requirement: Gamification data follows account deletion
The system SHALL remove or anonymize a learner's point events and aggregate score when
their account is deleted, and SHALL be able to rebuild aggregates from recorded events.

#### Scenario: Account deletion
- **WHEN** a learner deletes their account
- **THEN** their point events and score aggregate are removed or anonymized and excluded
  from the leaderboard
