Feature: Dashboard planning — journal summary for a given day
  As a project member
  I want to see which journal tabs have entries on the selected day
  So that I can quickly navigate to the relevant journal

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
      | id   | project_id | feature_type  | name          | position | status |
      | 0040 | 0020       | daily_journal | Team Journal  | 0        | active |
      | 0041 | 0020       | daily_journal | Sprint Notes  | 1        | active |
    And the documents table contains:
      | id   | content_html    | content_text |
      | 0101 | <p>Note A</p>   | Note A       |
      | 0102 | <p>Note B</p>   | Note B       |
      | 0103 | <p>Note C</p>   | Note C       |
    And the journal_blocks table contains:
      | id   | feature_instance_id | date       | document_id | position | status |
      | 0011 | 0040                | 2026-07-01 | 0101        | 0        | active |
      | 0012 | 0040                | 2026-07-01 | 0102        | 1        | active |
      | 0013 | 0041                | 2026-07-01 | 0103        | 0        | active |

  Scenario: GET /journal-blocks/accessible?date=2026-07-01 as admin — returns journal tabs with block count and tribe for the day
    Given I am authenticated as an administrator: user.id 0001
    When I GET /api/features/daily-journal/accessible?date=2026-07-01
    Then the response status code is 200
    And the response body includes:
      """
      {
        "journals": [
          {
            "feature_instance_id": "0041",
            "feature_instance_name": "Sprint Notes",
            "project_id": "0020",
            "project_name": "Alpha",
            "tribe_id": "0010",
            "block_count": 1
          },
          {
            "feature_instance_id": "0040",
            "feature_instance_name": "Team Journal",
            "project_id": "0020",
            "project_name": "Alpha",
            "tribe_id": "0010",
            "block_count": 2
          }
        ]
      }
      """

  Scenario: GET /journal-blocks/accessible?date=2026-07-02 — returns empty list when no blocks exist for the date
    Given I am authenticated as an administrator: user.id 0001
    When I GET /api/features/daily-journal/accessible?date=2026-07-02
    Then the response status code is 200
    And the response body is:
      """
      {"journals": []}
      """

  Scenario: GET /journal-blocks/accessible — archived blocks are not counted
    Given I am authenticated as an administrator: user.id 0001
    And the journal_blocks table contains:
      | id   | feature_instance_id | date       | document_id | position | status   |
      | 0011 | 0040                | 2026-07-01 | 0101        | 0        | active   |
      | 0012 | 0040                | 2026-07-01 | 0102        | 1        | archived |
      | 0013 | 0041                | 2026-07-01 | 0103        | 0        | active   |
    When I GET /api/features/daily-journal/accessible?date=2026-07-01
    Then the response status code is 200
    And the response body includes:
      """
      {
        "journals": [
          {
            "feature_instance_id": "0041",
            "block_count": 1
          },
          {
            "feature_instance_id": "0040",
            "block_count": 1
          }
        ]
      }
      """

  Scenario: GET /journal-blocks/accessible — resolves the tribe where the user is a manager when the project is shared across multiple tribes
    Given I am authenticated as a regular user: user.id 0002
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 0030 | Alice      | Member    | female | active |
    And the users table contains:
      | id   | email         | person_id | status |
      | 0002 | user@test.com | 0030      | active |
    And the represents table contains:
      | user_id | person_id | status |
      | 0002    | 0030      | active |
    And the tribes table contains:
      | id   | name     | status |
      | 0012 | QA Guild | active |
    And the tribes_projects table contains:
      | tribe_id | project_id |
      | 0012     | 0020       |
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
      | 1002 | 0012     | 0030      | manager  | active |
    When I GET /api/features/daily-journal/accessible?date=2026-07-01
    Then the response status code is 200
    And the response body includes:
      """
      {
        "journals": [
          {
            "feature_instance_id": "0041",
            "tribe_id": "0012",
            "block_count": 1
          },
          {
            "feature_instance_id": "0040",
            "tribe_id": "0012",
            "block_count": 2
          }
        ]
      }
      """

  @error_case
  Scenario: GET /journal-blocks/accessible as a user without dashboard access — 403 error
    Given I am authenticated as the person's owner: user.id 0003
    And the users table contains:
      | id   | email                 | status |
      | 0003 | profile_user@test.com | active |
    And the roles table contains:
      | name          | status |
      | profile-owner | active |
    And the role_permissions table contains:
      | role          | permission             |
      | profile-owner | can_manage_own_profile |
    And the user_roles table contains:
      | user                  | role          |
      | profile_user@test.com | profile-owner |
    When I GET /api/features/daily-journal/accessible?date=2026-07-01
    Then the response status code is 403
