## ADDED Requirements

### Requirement: Opening a showcased module invites without blocking
The system SHALL allow an anonymous visitor to open a published module from the landing
showcase without an account, and SHALL present a non-blocking invitation to create an
account to keep their progress.

#### Scenario: Anonymous visitor opens a showcased module
- **WHEN** an unauthenticated visitor selects a module from the landing showcase
- **THEN** the system opens the module and shows a dismissible invitation to create an
  account to save progress, without preventing access

#### Scenario: Authenticated visitor opens a showcased module
- **WHEN** an authenticated learner opens a module from the showcase
- **THEN** the system opens the module without showing the account invitation
