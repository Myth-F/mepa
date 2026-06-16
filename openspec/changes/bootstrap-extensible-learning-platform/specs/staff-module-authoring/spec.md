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

### Requirement: Modules are authored data, not application constants

The system SHALL store course/module content in the database through the module/version/block model and SHALL NOT require application code changes to add, edit, publish, archive, or reorder course content.

#### Scenario: Editor creates a course without code changes

- **WHEN** an authorized editor creates a module through the staff authoring surface
- **THEN** the system persists the module, version metadata, ordered blocks, and sources in PostgreSQL without modifying repository files

#### Scenario: Demo data is seeded

- **WHEN** a development or user-test environment is initialized with demo content
- **THEN** the seed uses the same authoring domain services and database tables as normal authoring and remains outside the runtime request path

#### Scenario: Public pages render courses

- **WHEN** a visitor opens the landing page, catalogue, or module reader
- **THEN** the system renders published module data from PostgreSQL/search documents rather than a hardcoded in-app course list

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

### Requirement: Staff can test the learner journey safely

The system SHALL allow active staff accounts to sign in to the public learner space using their staff credentials, while keeping staff sessions and learner sessions separate.

#### Scenario: Staff signs in as a learner

- **WHEN** an active staff member submits valid credentials on `/account/sign-in`
- **THEN** the system creates or reuses a separate learner identity for progression and creates only a learner session

#### Scenario: Learner session attempts staff access

- **WHEN** a staff member authenticated only through the learner space requests `/admin`
- **THEN** the system denies access until a separate staff session is created through `/admin/sign-in`
