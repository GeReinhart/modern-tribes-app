@wip
Feature: Add a person
  As an administrator
  I want to add a person to the platform
  So that they can be associated with tribes and projects

  Scenario: POST /persons with a valid body — the new record appears in the database
    Given I am authenticated as an administrator
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
    Given I am authenticated as an administrator
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
    Given I am authenticated as a regular user
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
