## ADDED Requirements

### Requirement: Staff identity is isolated from learner identity

The system SHALL authenticate staff accounts through a staff-only identity store and session cookie, and SHALL deny learner sessions access to staff routes.

#### Scenario: Learner attempts to access administration

- **WHEN** an authenticated learner requests an `/admin` route
- **THEN** the system denies access without creating or upgrading a staff session

#### Scenario: Unauthenticated visitor attempts to access administration

- **WHEN** a visitor without a valid staff session requests a protected `/admin` route
- **THEN** the system redirects the visitor to the separate staff sign-in page without disclosing administration content

#### Scenario: Staff signs in

- **WHEN** an active staff account submits valid credentials
- **THEN** the system creates a staff-only session and grants access according to the staff role

### Requirement: Staff-only navigation is disclosed only to authenticated staff

The system SHALL show staff-space links, labels, and session actions only when a valid active staff session has been verified server-side.

#### Scenario: Public visitor views the interface

- **WHEN** a visitor without a valid staff session views any public page
- **THEN** no link or promotional content for the staff space appears in the header, footer, or page content

#### Scenario: Authenticated staff views the interface

- **WHEN** a staff member with a valid active session views the interface
- **THEN** the system shows the staff-space navigation and a staff sign-out action

### Requirement: Staff can compose modules from typed blocks

The system SHALL allow authorized staff to create a module draft and add, edit, remove, and reorder registered block types.

#### Scenario: Editor composes a draft

- **WHEN** an editor adds valid blocks and changes their order
- **THEN** the system persists the validated draft and preserves the requested order

#### Scenario: Invalid block payload is submitted

- **WHEN** an editor submits a block payload that does not satisfy its registered schema version
- **THEN** the system rejects the change and presents actionable validation errors

### Requirement: Staff can preview and publish validated versions

The system SHALL provide an accessible learner-view preview and SHALL publish only complete drafts that satisfy all module and block validation rules.

#### Scenario: Valid draft is published

- **WHEN** an authorized editor publishes a valid draft
- **THEN** the system makes that version visible to learners and makes its content immutable

#### Scenario: Invalid draft publication is attempted

- **WHEN** an editor attempts to publish a draft with validation errors
- **THEN** the system keeps the draft unpublished and identifies every blocking error

### Requirement: Published module history is retained

The system SHALL retain previous published versions and SHALL create a new draft for subsequent edits.

#### Scenario: Published module is edited

- **WHEN** an editor starts editing a published module
- **THEN** the system leaves the published version unchanged and creates or updates a separate draft
