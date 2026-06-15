## ADDED Requirements

### Requirement: AI providers are isolated behind a neutral contract

The system SHALL define a provider-neutral tutor contract and SHALL keep vendor SDKs and formats outside learning and authoring domain logic.

#### Scenario: Future provider adapter is replaced

- **WHEN** one conforming tutor provider adapter is replaced by another
- **THEN** module content, progress tracking, and authoring contracts remain unchanged

### Requirement: Tutor context is built from trusted published content

The system SHALL construct future tutor context only from a requested published module version, its registered block projections, and its tracked sources.

#### Scenario: Context is built for a published module

- **WHEN** the context builder receives a published module version identifier
- **THEN** it returns normalized module content with source identifiers and excludes unrelated modules

#### Scenario: Context is requested for a draft

- **WHEN** the context builder receives a draft or archived version identifier
- **THEN** it refuses to produce learner tutor context

### Requirement: Tutor feature is disabled by default

The system SHALL expose no active tutor interaction unless an explicit feature flag and a configured provider adapter are both present.

#### Scenario: Default deployment starts

- **WHEN** the platform starts with the documented default configuration
- **THEN** no tutor UI or provider request is available
