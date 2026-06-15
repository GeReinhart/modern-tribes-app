Feature: Get archived projects by tribe
  As a tribe manager
  I want to see archived projects in a tribe
  So that I can decide to reactivate them

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

  Scenario: GET /projects/by/tribe/0010/archived as manager — archived projects returned
    Given I am authenticated as a regular user: user.id 0002
    And the persons table contains:
      | id   | first_name | last_name | status |
      | 0030 | Alice      | Manager   | active |
    And the users table contains:
      | id   | email         | person_id | status |
      | 0002 | user@test.com | 0030      | active |
    And the tribes table contains:
      | id   | name        | status |
      | 0010 | Engineering | active |
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | manager  | active |
    And the projects table contains:
      | id   | name  | status   |
      | 0020 | Alpha | active   |
      | 0021 | Beta  | archived |
    And the tribes_projects table contains:
      | tribe_id | project_id | relation |
      | 0010     | 0020       | manager  |
      | 0010     | 0021       | manager  |
    When I GET /api/features/tribes-projects/projects/by/tribe/0010/archived
    Then the response status code is 200
    And the response body includes:
      """
      [
        {
          "project_id": "0021",
          "project_name": "Beta"
        }
      ]
      """

  @error_case
  Scenario: GET /projects/by/tribe/0010/archived as a member — 403 error
    Given I am authenticated as a regular user: user.id 0002
    And the persons table contains:
      | id   | first_name | last_name | status |
      | 0030 | Alice      | Member    | active |
    And the users table contains:
      | id   | email         | person_id | status |
      | 0002 | user@test.com | 0030      | active |
    And the tribes table contains:
      | id   | name        | status |
      | 0010 | Engineering | active |
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the projects table contains:
      | id   | name | status   |
      | 0021 | Beta | archived |
    And the tribes_projects table contains:
      | tribe_id | project_id | relation |
      | 0010     | 0021       | member   |
    When I GET /api/features/tribes-projects/projects/by/tribe/0010/archived
    Then the response status code is 403
