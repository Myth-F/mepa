## ADDED Requirements

### Requirement: Personal space shows points and level
The system SHALL display a learner's current points total and level in their personal
space, consistent with their awarded point events.

#### Scenario: Learner opens their personal space
- **WHEN** an authenticated learner views their personal space
- **THEN** the system shows their current points total and level

### Requirement: Learner controls leaderboard participation
The system SHALL provide an accessible control in the personal space for the learner to
join or leave the leaderboard, defaulting to not participating.

#### Scenario: Learner toggles participation
- **WHEN** a learner uses the leaderboard participation control
- **THEN** the system updates their participation and confirms the new state
