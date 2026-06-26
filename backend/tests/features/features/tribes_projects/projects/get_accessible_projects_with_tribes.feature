Feature: Get accessible projects with tribe name for a user
  As a dashboard user
  I want to retrieve my accessible projects with their tribe name
  So that I can pick a project when adding a task or event from the dashboard

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

  Scenario: GET /projects/by/user/{user_id}/accessible-with-tribes — user sees their projects with tribe name
    Given I am authenticated as a regular user: user.id 0002
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 0030 | Alice      | Member    | female | active |
    And the users table contains:
      | id   | email         | person_id | status |
      | 0002 | user@test.com | 0030      | active |
    And the tribes table contains:
      | id   | name        | status |
      | 0010 | Engineering | active |
      | 0011 | Marketing   | active |
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
      | 1002 | 0011     | 0030      | member   | active |
    And the projects table contains:
      | id   | name    | status |
      | 0020 | Alpha   | active |
      | 0021 | Beta    | active |
      | 0022 | Gamma   | active |
    And the tribes_projects table contains:
      | tribe_id | project_id | relation |
      | 0010     | 0020       | member   |
      | 0011     | 0021       | member   |
      | 0010     | 0022       | member   |
      | 0011     | 0022       | member   |
    When I GET /api/features/tribes-projects/projects/by/user/0002/accessible-with-tribes
    Then the response status code is 200
    And the response body includes:
      """
      [
        {
          "project_id": "0020",
          "project_name": "Alpha",
          "tribe_name": "Engineering"
        },
        {
          "project_id": "0021",
          "project_name": "Beta",
          "tribe_name": "Marketing"
        },
        {
          "project_id": "0022",
          "project_name": "Gamma",
          "tribe_name": "Engineering"
        }
      ]
      """

  @error_case
  Scenario: GET /projects/by/user/{user_id}/accessible-with-tribes — user cannot query another user's projects
    Given I am authenticated as a regular user: user.id 0002
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 0031 | Bob        | Other     | male   | active |
    And the users table contains:
      | id   | email           | person_id | status |
      | 0003 | other@test.com  | 0031      | active |
    When I GET /api/features/tribes-projects/projects/by/user/0003/accessible-with-tribes
    Then the response status code is 403
