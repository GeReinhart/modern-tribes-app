Feature: List journal blocks by label across all days
  As a project member
  I want to see all blocks tagged with a given label
  So that I can review related notes regardless of the day they were written

  Background:
    Given the users table contains:
      | id   | email          | status |
      | 0001 | admin@test.com | active |
      | 0002 | user@test.com  | active |
    And the roles table contains:
      | name          | status |
      | administrator | active |
      | viewer        | active |
    And the role_permissions table contains:
      | role          | permission                 |
      | administrator | admin                      |
      | viewer        | can_access_attached_tribes |
    And the user_roles table contains:
      | user           | role          |
      | admin@test.com | administrator |
      | user@test.com  | viewer        |
    And the tribes table contains:
      | id   | name    | status |
      | 0010 | DevTeam | active |
    And the projects table contains:
      | id   | name  | status |
      | 0020 | Alpha | active |
    And the tribes_projects table contains:
      | tribe_id | project_id |
      | 0010     | 0020       |
    And the projects_features table contains:
      | id   | project_id | feature_type  | name    | position | status |
      | 0040 | 0020       | daily_journal | Journal | 0        | active |
    And the labels table contains:
      | id   | name    | color   | feature_instance_id | status |
      | 0020 | Meeting | #3b82f6 | 0040                | active |

  Scenario: GET /journal-blocks/by-label/{label_id} as admin — returns matching blocks, most recent day first
    Given I am authenticated as an administrator: user.id 0001
    And the documents table contains:
      | id   | content_html             | content_text        |
      | 0101 | <p>Stand-up notes</p>   | Stand-up notes      |
      | 0102 | <p>Retro notes</p>      | Retro notes         |
      | 0103 | <p>Unrelated note</p>   | Unrelated note      |
    And the journal_blocks table contains:
      | id   | feature_instance_id | date       | document_id | position | status |
      | 0011 | 0040                | 2026-07-01 | 0101        | 0        | active |
      | 0012 | 0040                | 2026-06-30 | 0102        | 0        | active |
      | 0013 | 0040                | 2026-07-01 | 0103        | 1        | active |
    And the label_entities table contains:
      | label_id | entity_type   | entity_id |
      | 0020     | journal_block | 0011      |
      | 0020     | journal_block | 0012      |
    When I GET /api/features/daily-journal/0040/blocks/by-label/0020
    Then the response status code is 200
    And the response body includes:
      """
      {
        "blocks": [
          {"id": "0011", "date": "2026-07-01"},
          {"id": "0012", "date": "2026-06-30"}
        ]
      }
      """

  Scenario: GET /journal-blocks/by-label/{label_id} — archived blocks are excluded
    Given I am authenticated as an administrator: user.id 0001
    And the documents table contains:
      | id   | content_html        | content_text  |
      | 0101 | <p>Active note</p>  | Active note   |
      | 0102 | <p>Deleted note</p> | Deleted note  |
    And the journal_blocks table contains:
      | id   | feature_instance_id | date       | document_id | position | status   |
      | 0011 | 0040                | 2026-07-01 | 0101        | 0        | active   |
      | 0012 | 0040                | 2026-06-30 | 0102        | 0        | archived |
    And the label_entities table contains:
      | label_id | entity_type   | entity_id |
      | 0020     | journal_block | 0011      |
      | 0020     | journal_block | 0012      |
    When I GET /api/features/daily-journal/0040/blocks/by-label/0020
    Then the response status code is 200
    And the response body is:
      """
      {
        "blocks": [
          {"id": "0011", "date": "2026-07-01", "label_ids": ["0020"]}
        ]
      }
      """

  @error_case
  Scenario: GET /journal-blocks/by-label/{label_id} as viewer without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/daily-journal/0040/blocks/by-label/0020
    Then the response status code is 403
