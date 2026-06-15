Feature: List positions by tribe
  As an administrator
  I want to list all positions for a given tribe
  So that I can see who occupies roles in that tribe

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
      | id   | name        | status |
      | 0020 | Engineering | active |
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 0030 | Alice      | Dupont    | female | active |

  Scenario: GET /positions/by/tribe/0020 as admin — positions are returned
    Given I am authenticated as an administrator: user.id 0001
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0020     | 0030      | member   | active |
    When I GET /api/features/tribes-projects/positions/by/tribe/0020
    Then the response status code is 200
    And the response body includes:
      """
      [
        {
          "id": "1001",
          "tribe_id": "0020",
          "person_id": "0030",
          "position": "member",
          "status": "active"
        }
      ]
      """

  @error_case
  Scenario: GET /positions/by/tribe/0020 as a viewer — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tribes-projects/positions/by/tribe/0020
    Then the response status code is 403
