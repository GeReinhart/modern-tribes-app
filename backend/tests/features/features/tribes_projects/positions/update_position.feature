@wip
Feature: Update a position
  As an administrator
  I want to change a person's position in a tribe
  So that their role stays current

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

  Scenario: PUT /positions/0010 with valid body as admin — the position is updated
    Given I am authenticated as an administrator: user.id 0001
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 0010 | 0020     | 0030      | member   | active |
    When I PUT /api/features/tribes-projects/positions/0010 with body:
      """
      {"position": "manager"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "id": "0010",
        "tribe_id": "0020",
        "person_id": "0030",
        "position": "manager",
        "status": "active"
      }
      """
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 0010 | 0020     | 0030      | manager  | active |

  @error_case
  Scenario: PUT /positions/0010 as a viewer — 403 error and the position is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 0010 | 0020     | 0030      | member   | active |
    When I PUT /api/features/tribes-projects/positions/0010 with body:
      """
      {"position": "manager"}
      """
    Then the response status code is 403
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 0010 | 0020     | 0030      | member   | active |
