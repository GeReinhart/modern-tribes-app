@wip
Feature: Create a position
  As an administrator
  I want to assign a person a position in a tribe
  So that their role within the tribe is recorded

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

  Scenario: POST /positions/ with valid body as admin — the position is created
    Given I am authenticated as an administrator: user.id 0001
    And the positions table contains:
      | id | tribe_id | person_id | position | status |
    When I POST /api/features/tribes-projects/positions/ with body:
      """
      {
        "tribe_id": "0020",
        "person_id": "0030",
        "position": "member"
      }
      """
    Then the response status code is 201
    And the positions table contains:
      | tribe_id | person_id | position | status |
      | 0020     | 0030      | member   | active |

  Scenario: POST /positions/ with missing required field — 422 error and the database is not modified
    Given I am authenticated as an administrator: user.id 0001
    And the positions table contains:
      | id | tribe_id | person_id | position | status |
    When I POST /api/features/tribes-projects/positions/ with body:
      """
      {"tribe_id": "0020", "person_id": "0030"}
      """
    Then the response status code is 422
    And the positions table contains:
      | id | tribe_id | person_id | position | status |

  @error_case
  Scenario: POST /positions/ as a viewer — 403 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id | tribe_id | person_id | position | status |
    When I POST /api/features/tribes-projects/positions/ with body:
      """
      {
        "tribe_id": "0020",
        "person_id": "0030",
        "position": "member"
      }
      """
    Then the response status code is 403
    And the positions table contains:
      | id | tribe_id | person_id | position | status |
