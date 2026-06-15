## ADDED Requirements

### Requirement: Complete stack is deployable with Docker Compose

The system SHALL provide a Docker Compose configuration that runs the application, PostgreSQL, S3-compatible object storage initialization, and scheduled backups on a single VPS.

#### Scenario: Fresh VPS deployment

- **WHEN** an operator supplies documented environment values and follows the deployment runbook
- **THEN** the complete stack starts, initializes storage, applies migrations once, and reports healthy

### Requirement: Runtime data survives container replacement

The system SHALL store PostgreSQL data, object-storage data, and backup archives in persistent volumes independent of application containers.

#### Scenario: Containers are recreated

- **WHEN** an operator replaces or recreates all runtime containers without deleting volumes
- **THEN** accounts, modules, progress, uploaded media, and backup archives remain available

### Requirement: Migrations are controlled and observable

The system SHALL provide a one-shot migration command or Compose service that completes successfully before the new application version is started.

#### Scenario: Migration succeeds

- **WHEN** an operator deploys a version containing a valid migration
- **THEN** the migration exits successfully and the application can start on the updated schema

#### Scenario: Migration fails

- **WHEN** a migration exits unsuccessfully
- **THEN** the deployment procedure stops before replacing the working application version and reports the failure

### Requirement: Internal services are not publicly exposed

The system SHALL keep PostgreSQL and object-storage administrative endpoints off public host interfaces and SHALL expose the application only to the VPS reverse proxy.

#### Scenario: External client scans service ports

- **WHEN** a client outside the VPS attempts to connect directly to PostgreSQL or MinIO administration ports
- **THEN** those services are unreachable through the Compose configuration

### Requirement: Secrets are external to version control

The system SHALL obtain production credentials and cryptographic secrets from operator-supplied environment or secret files that are excluded from version control.

#### Scenario: Repository is inspected

- **WHEN** the tracked repository and example configuration are inspected
- **THEN** no production secret or default production credential is present

### Requirement: Services expose operational health

The system SHALL define health checks for the application, PostgreSQL, and object storage and SHALL configure dependent services to wait for healthy prerequisites.

#### Scenario: Database is unavailable

- **WHEN** PostgreSQL is unhealthy during startup
- **THEN** the application is not reported healthy and the failure is visible to the operator

### Requirement: Backups and restore are documented and testable

The system SHALL create scheduled PostgreSQL and object-storage backups with configurable retention and SHALL document off-host copying and restoration.

#### Scenario: Restore drill is performed

- **WHEN** an operator follows the restore procedure using a retained backup
- **THEN** the restored environment contains the expected database records and media objects
