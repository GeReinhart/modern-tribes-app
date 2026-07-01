Feature: List journal blocks for a given day
  As a project member
  I want to see all blocks for a specific date
  So that I can read and edit the day's journal entries

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

  Scenario: GET /journal-blocks?date=2026-07-01 as admin — returns blocks for the day in position order
    Given I am authenticated as an administrator: user.id 0001
    And the documents table contains:
      | id   | content_html      | content_text |
      | 0101 | <p>First note</p> | First note   |
      | 0102 | <p>Second note</p>| Second note  |
    And the journal_blocks table contains:
      | id   | feature_instance_id | date       | document_id | position | status |
      | 0011 | 0040                | 2026-07-01 | 0101        | 0        | active |
      | 0012 | 0040                | 2026-07-01 | 0102        | 1        | active |
    When I GET /api/features/daily-journal/0040/blocks?date=2026-07-01
    Then the response status code is 200
    And the response body includes:
      """
      {
        "blocks": [
          {"id": "0011", "position": 0, "content_html": "<p>First note</p>"},
          {"id": "0012", "position": 1, "content_html": "<p>Second note</p>"}
        ]
      }
      """

  Scenario: GET /journal-blocks?date=2026-07-01 — archived blocks are excluded
    Given I am authenticated as an administrator: user.id 0001
    And the documents table contains:
      | id   | content_html      | content_text |
      | 0101 | <p>Active note</p>| Active note  |
      | 0102 | <p>Old note</p>   | Old note     |
    And the journal_blocks table contains:
      | id   | feature_instance_id | date       | document_id | position | status   |
      | 0011 | 0040                | 2026-07-01 | 0101        | 0        | active   |
      | 0012 | 0040                | 2026-07-01 | 0102        | 1        | archived |
    When I GET /api/features/daily-journal/0040/blocks?date=2026-07-01
    Then the response status code is 200
    And the response body is:
      """
      {
        "blocks": [
          {"id": "0011", "position": 0, "content_html": "<p>Active note</p>", "label_ids": []}
        ]
      }
      """

  Scenario: GET /journal-blocks?date=2026-07-02 — returns empty list for a day with no blocks
    Given I am authenticated as an administrator: user.id 0001
    And the journal_blocks table contains:
      | id | feature_instance_id | date | document_id | position | status |
    When I GET /api/features/daily-journal/0040/blocks?date=2026-07-02
    Then the response status code is 200
    And the response body is:
      """
      {"blocks": []}
      """

  @error_case
  Scenario: GET /journal-blocks as viewer without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/daily-journal/0040/blocks?date=2026-07-01
    Then the response status code is 403
