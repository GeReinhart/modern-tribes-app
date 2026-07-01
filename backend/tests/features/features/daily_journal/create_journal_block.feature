Feature: Create a journal block
  As a project member
  I want to add a block to a daily journal
  So that the team can capture notes for a given day

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

  Scenario: POST /journal-blocks as admin — block and document are created
    Given I am authenticated as an administrator: user.id 0001
    And the journal_blocks table contains:
      | id | feature_instance_id | date | document_id | position | status |
    And the documents table contains:
      | id | content_html | content_text |
    When I POST /api/features/daily-journal/blocks with body:
      """
      {
        "feature_instance_id": "0040",
        "date": "2026-07-01",
        "position": 0,
        "content_html": "<p>Team stood up at 9am</p>"
      }
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "date": "2026-07-01",
        "position": 0,
        "content_html": "<p>Team stood up at 9am</p>"
      }
      """
    And the journal_blocks table contains:
      | feature_instance_id | date       | position | status |
      | 0040                | 2026-07-01 | 0        | active |
    And the documents table contains:
      | content_html                  |
      | <p>Team stood up at 9am</p>  |

  Scenario: POST /journal-blocks with position between existing blocks — block is inserted at the given position
    Given I am authenticated as an administrator: user.id 0001
    And the documents table contains:
      | id   | content_html      | content_text    |
      | 0101 | <p>First note</p> | First note      |
      | 0102 | <p>Third note</p> | Third note      |
    And the journal_blocks table contains:
      | id   | feature_instance_id | date       | document_id | position | status |
      | 0011 | 0040                | 2026-07-01 | 0101        | 0        | active |
      | 0012 | 0040                | 2026-07-01 | 0102        | 1        | active |
    When I POST /api/features/daily-journal/blocks with body:
      """
      {
        "feature_instance_id": "0040",
        "date": "2026-07-01",
        "position": 1,
        "content_html": "<p>Second note</p>"
      }
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "date": "2026-07-01",
        "position": 1,
        "content_html": "<p>Second note</p>"
      }
      """
    And the journal_blocks table contains:
      | id   | feature_instance_id | date       | position | status |
      | 0011 | 0040                | 2026-07-01 | 0        | active |
      | 0012 | 0040                | 2026-07-01 | 2        | active |

  @error_case
  Scenario: POST /journal-blocks as viewer without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    And the journal_blocks table contains:
      | id | feature_instance_id | date | document_id | position | status |
    When I POST /api/features/daily-journal/blocks with body:
      """
      {
        "feature_instance_id": "0040",
        "date": "2026-07-01",
        "position": 0,
        "content_html": "<p>Should not be saved</p>"
      }
      """
    Then the response status code is 403
    And the journal_blocks table contains:
      | id | feature_instance_id | date | document_id | position | status |
