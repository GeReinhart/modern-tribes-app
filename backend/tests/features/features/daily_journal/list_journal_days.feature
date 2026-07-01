Feature: List dates with journal content
  As a project member
  I want to know which days have journal blocks
  So that I can navigate only to days with content

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

  Scenario: GET /journal-days as admin — returns dates with active blocks, most recent first
    Given I am authenticated as an administrator: user.id 0001
    And the documents table contains:
      | id   | content_html  | content_text |
      | 0101 | <p>Note A</p> | Note A       |
      | 0102 | <p>Note B</p> | Note B       |
      | 0103 | <p>Note C</p> | Note C       |
    And the journal_blocks table contains:
      | id   | feature_instance_id | date       | document_id | position | status   |
      | 0011 | 0040                | 2026-07-01 | 0101        | 0        | active   |
      | 0012 | 0040                | 2026-06-30 | 0102        | 0        | active   |
      | 0013 | 0040                | 2026-06-28 | 0103        | 0        | archived |
    When I GET /api/features/daily-journal/0040/days
    Then the response status code is 200
    And the response body is:
      """
      {"dates": ["2026-07-01", "2026-06-30"]}
      """

  Scenario: GET /journal-days — returns empty list when there are no active blocks
    Given I am authenticated as an administrator: user.id 0001
    And the journal_blocks table contains:
      | id | feature_instance_id | date | document_id | position | status |
    When I GET /api/features/daily-journal/0040/days
    Then the response status code is 200
    And the response body is:
      """
      {"dates": []}
      """

  @error_case
  Scenario: GET /journal-days as viewer without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/daily-journal/0040/days
    Then the response status code is 403
