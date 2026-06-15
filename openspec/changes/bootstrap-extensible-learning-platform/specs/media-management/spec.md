## ADDED Requirements

### Requirement: Staff can upload validated media

The system SHALL allow authorized staff to upload supported media through S3-compatible object storage while enforcing size, MIME type, generated object keys, and accessibility metadata rules.

#### Scenario: Meaningful image is uploaded

- **WHEN** an editor uploads a supported meaningful image with alternative text
- **THEN** the system stores the object and persists its metadata for use in module blocks

#### Scenario: Unsupported media is uploaded

- **WHEN** an editor uploads an unsupported or oversized file
- **THEN** the system rejects the upload and does not create a usable media record

### Requirement: Media storage provider is replaceable

The system SHALL access media through a provider-neutral storage port configured by environment variables.

#### Scenario: Storage implementation changes

- **WHEN** operators replace MinIO configuration with another S3-compatible provider
- **THEN** module authoring and learner rendering continue without domain-model changes

### Requirement: Unpublished media is not publicly disclosed

The system SHALL restrict access to media that is not referenced by a published module version.

#### Scenario: Learner requests draft-only media

- **WHEN** a learner requests an object used only by a draft
- **THEN** the system denies access or returns a short-lived URL only after authorized staff access
