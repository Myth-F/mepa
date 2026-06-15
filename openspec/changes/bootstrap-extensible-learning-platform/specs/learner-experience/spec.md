## ADDED Requirements

### Requirement: Learners can manage private accounts and profiles

The system SHALL allow learners to register, authenticate, view their profile and progress, and delete their account without exposing their email address publicly.

#### Scenario: Learner registers successfully

- **WHEN** a visitor provides valid unique account details
- **THEN** the system creates a learner account and an isolated learner session

#### Scenario: Learner deletes their account

- **WHEN** an authenticated learner confirms account deletion
- **THEN** the system removes or anonymizes their personal data and invalidates their sessions

### Requirement: Learners can consume only published module versions

The system SHALL list and render only current published module versions to learners.

#### Scenario: Visitor starts without an account

- **WHEN** a visitor chooses to start a published module without creating an account
- **THEN** the system opens the module without blocking the visitor with authentication

#### Scenario: Learner opens a published module

- **WHEN** a learner selects a published module
- **THEN** the system renders its ordered blocks with source information and accessible controls

#### Scenario: Learner requests a draft

- **WHEN** a learner requests a draft or archived module version
- **THEN** the system does not disclose its content

### Requirement: Learner progress is tracked against module versions

The system SHALL record module completion, quiz attempts, scores, and dilemma votes against the published module version used by the learner.

#### Scenario: Learner completes a module

- **WHEN** a learner completes all required blocks
- **THEN** the system records completion and displays updated progress

#### Scenario: Learner votes twice on one dilemma

- **WHEN** a learner attempts a second vote for the same dilemma version
- **THEN** the system prevents a duplicate vote and preserves the original vote

### Requirement: Learner interactions are accessible

The system SHALL support keyboard operation, visible focus, associated labels, understandable validation messages, and non-color-only status indicators for learner workflows.

#### Scenario: Keyboard-only module completion

- **WHEN** a learner navigates and completes an interactive module using only a keyboard
- **THEN** every required control is reachable, operable, and visibly focused

### Requirement: Public journeys use plain language and clear next actions

The system SHALL explain account benefits, module steps, empty states, and errors in concise language that does not assume technical knowledge.

#### Scenario: First-time visitor reaches the landing page

- **WHEN** a first-time visitor views the landing page
- **THEN** the system presents one clear action to start a module and states that an account is not required

#### Scenario: No module is available

- **WHEN** the public catalogue contains no published module
- **THEN** the system explains why the catalogue is empty and provides a way back to the homepage
