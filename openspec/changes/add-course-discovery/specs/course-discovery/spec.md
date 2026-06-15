## ADDED Requirements

### Requirement: The catalogue is paginated, sortable and performant at scale
The system SHALL serve the catalogue from an indexed discovery document with pagination
and selectable ordering, and SHALL NOT load all published modules in a single unbounded
query.

#### Scenario: Browsing a large catalogue
- **WHEN** a visitor opens the catalogue with many published modules
- **THEN** the system returns one bounded page of results with controls to reach further
  pages, without fetching the entire catalogue

#### Scenario: Choosing an order
- **WHEN** a visitor sorts the catalogue (most recent, most popular, or alphabetical)
- **THEN** the system returns results in that order and reflects the choice in the page URL

### Requirement: Learners can filter the catalogue by facets
The system SHALL let visitors narrow the catalogue by category, level, duration and tags,
and SHALL keep the active filters visible and removable. Tag filtering SHALL be presented
as checkboxes that allow selecting several tags at once, and selecting multiple tags SHALL
combine them as a single, refinable filter.

#### Scenario: Filtering by category and level
- **WHEN** a visitor selects a category and a level
- **THEN** the system shows only modules matching both and indicates how to clear each filter

#### Scenario: Filtering by several tags with checkboxes
- **WHEN** a visitor ticks two tag checkboxes and applies the filter
- **THEN** the system shows modules matching the selected tags, keeps both checkboxes ticked,
  and lets the visitor untick either one to broaden the results

#### Scenario: Filters that match nothing
- **WHEN** a combination of filters matches no module
- **THEN** the system shows an accessible empty result that explains how to broaden the search

### Requirement: Learners can search modules by keyword
The system SHALL provide a keyword search over module title, summary and projected body
text that is case- and accent-insensitive, ranked by relevance, and restricted to published
content.

#### Scenario: Keyword search returns ranked results
- **WHEN** a visitor searches a term present in published modules (including with different
  accents or case)
- **THEN** the system returns matching published modules ordered by relevance, never
  exposing draft or archived content

#### Scenario: Search with no match
- **WHEN** a search returns no result
- **THEN** the system shows a guiding no-results state (check spelling, remove a filter, or
  browse categories)

### Requirement: Discovery is accessible and shareable
The system SHALL expose a labelled search form, announce the number of results to assistive
technologies, provide keyboard-operable filters, avoid conveying relevance by colour alone,
and encode the search, filter and sort state in the page URL.

#### Scenario: Operating discovery with a keyboard and screen reader
- **WHEN** a user runs a search and applies filters using only a keyboard
- **THEN** the search field and every filter are reachable and operable, and the updated
  result count is announced

#### Scenario: Sharing a result set
- **WHEN** a visitor copies the page URL after searching and filtering
- **THEN** opening that URL reproduces the same search, filters and ordering

### Requirement: Search is accessed through a provider-neutral port
The system SHALL access discovery through a provider-neutral search port with a default
PostgreSQL implementation, keeping the catalogue UI independent of the search engine.

#### Scenario: Search implementation changes
- **WHEN** the search adapter is replaced by another conforming implementation
- **THEN** the catalogue, filters and ordering keep working without changes to the UI or
  domain contracts

### Requirement: The discovery document reflects only published content
The system SHALL build and refresh a module's discovery document when it is published,
remove it when the module has no published version, and be able to rebuild all documents
from published content.

#### Scenario: Module is published
- **WHEN** a module version is published
- **THEN** its discovery document (title, summary, classification, body projection) becomes
  searchable and browsable

#### Scenario: Document rebuild
- **WHEN** an operator recomputes discovery documents
- **THEN** the catalogue and search reflect exactly the current published modules

### Requirement: The landing page surfaces discoverable modules
The system SHALL present a discovery showcase on the landing page that prioritizes
staff-featured modules and fills the remainder with popular and recent modules, without
relying on any tracking or personal data.

#### Scenario: Newcomer arrives on the landing page
- **WHEN** a first-time, unauthenticated visitor opens the landing page
- **THEN** the system shows a selection of published modules to explore, varied without using
  any identifying or behavioural data

#### Scenario: No featured module is set
- **WHEN** staff have featured no module
- **THEN** the showcase still presents relevant modules from popular and recent content

### Requirement: Returning visitors get continuation and recommendations
The system SHALL offer an authenticated returning visitor a way to continue an in-progress
module and a set of recommended modules.

#### Scenario: Returning learner with progress
- **WHEN** an authenticated learner who has started modules opens the landing page
- **THEN** the system offers to continue an in-progress module and suggests related modules
