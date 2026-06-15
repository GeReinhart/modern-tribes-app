Feature: Add a person
  As an administrator
  I want to add a person to the platform
  So that they can be associated with tribes and projects

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

  Scenario: POST /persons with a valid body — the new record appears in the database
    Given I am authenticated as an administrator: user.id 0001
    And the persons table contains:
      | first_name | last_name | gender | status |
    When I POST /api/platform/functions/people/persons/ with body:
      """
      {
        "first_name": "Alice",
        "last_name": "Dupont",
        "gender": "female"
      }
      """
    Then the response status code is 201
    And the persons table contains:
      | first_name | last_name | gender | status |
      | Alice      | Dupont    | female | active |

  Scenario: POST /persons with a missing required field — 422 error and the database is not modified
    Given I am authenticated as an administrator: user.id 0001
    And the persons table contains:
      | first_name | last_name | gender | status |
    When I POST /api/platform/functions/people/persons/ with body:
      """
      {
        "first_name": "Alice",
        "gender": "female"
      }
      """
    Then the response status code is 422
    And the persons table contains:
      | first_name | last_name | gender | status |

  @error_case
  Scenario: POST /persons as a non-admin user — 403 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the persons table contains:
      | first_name | last_name | gender | status |
    When I POST /api/platform/functions/people/persons/ with body:
      """
      {
        "first_name": "Alice",
        "last_name": "Dupont",
        "gender": "female"
      }
      """
    Then the response status code is 403
    And the persons table contains:
      | first_name | last_name | gender | status |
