## ADDED Requirements

### Requirement: Staff classify and curate modules for discovery
The system SHALL let authorized staff assign a category, tags, level, estimated duration and
language to a module version, and SHALL let staff feature a module to prioritize it in the
landing showcase.

#### Scenario: Editor classifies a draft
- **WHEN** an editor sets a category, level, duration, language and tags on a draft
- **THEN** the system persists the classification with that version and uses it for facets
  once published

#### Scenario: Staff features a module
- **WHEN** an authorized staff member marks a module as featured
- **THEN** the module is prioritized in the landing showcase while it has a published version

### Requirement: Publication maintains the discovery document
The system SHALL build or refresh a module's discovery document as part of publishing a
version, and SHALL remove it when the module no longer has a published version.

#### Scenario: Publishing updates discovery
- **WHEN** a version is published
- **THEN** the module becomes searchable and browsable with its current title, summary and
  classification

#### Scenario: Last published version is archived
- **WHEN** a module ends up with no published version
- **THEN** it no longer appears in the catalogue, search or showcase
