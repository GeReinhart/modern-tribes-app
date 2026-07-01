Feature: Delete a journal block
  As a project member
  I want to remove a block from the journal
  So that outdated or incorrect entries are cleaned up

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
      | id   | content_html  | content_text |
      | 0101 | <p>A note</p> | A note       |
    And the journal_blocks table contains:
      | id   | feature_instance_id | date       | document_id | position | status |
      | 0011 | 0040                | 2026-07-01 | 0101        | 0        | active |

  Scenario: DELETE /journal-blocks/{id} as admin — block is archived
    Given I am authenticated as an administrator: user.id 0001
    When I DELETE /api/features/daily-journal/blocks/0011
    Then the response status code is 200
    And the journal_blocks table contains:
      | id   | status   |
      | 0011 | archived |

  @error_case
  Scenario: DELETE /journal-blocks/{id} as viewer without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I DELETE /api/features/daily-journal/blocks/0011
    Then the response status code is 403
    And the journal_blocks table contains:
      | id   | status |
      | 0011 | active |
