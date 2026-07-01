Feature: Reorder journal blocks within a day
  As a project member
  I want to move blocks up and down within a day
  So that related notes appear in a meaningful order

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
    And the documents table contains:
      | id   | content_html      | content_text |
      | 0101 | <p>First note</p> | First note   |
      | 0102 | <p>Second note</p>| Second note  |
      | 0103 | <p>Third note</p> | Third note   |
    And the journal_blocks table contains:
      | id   | feature_instance_id | date       | document_id | position | status |
      | 0011 | 0040                | 2026-07-01 | 0101        | 0        | active |
      | 0012 | 0040                | 2026-07-01 | 0102        | 1        | active |
      | 0013 | 0040                | 2026-07-01 | 0103        | 2        | active |

  Scenario: PUT /journal-blocks/reorder as admin — positions are updated
    Given I am authenticated as an administrator: user.id 0001
    When I PUT /api/features/daily-journal/blocks/reorder with body:
      """
      {
        "feature_instance_id": "0040",
        "date": "2026-07-01",
        "ordered_ids": ["0013", "0011", "0012"]
      }
      """
    Then the response status code is 200
    And the journal_blocks table contains:
      | id   | position |
      | 0011 | 1        |
      | 0012 | 2        |
      | 0013 | 0        |

  @error_case
  Scenario: PUT /journal-blocks/reorder as viewer without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I PUT /api/features/daily-journal/blocks/reorder with body:
      """
      {
        "feature_instance_id": "0040",
        "date": "2026-07-01",
        "ordered_ids": ["0013", "0011", "0012"]
      }
      """
    Then the response status code is 403
    And the journal_blocks table contains:
      | id   | position |
      | 0011 | 0        |
      | 0012 | 1        |
      | 0013 | 2        |
