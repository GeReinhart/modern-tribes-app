Feature: Create a represents link
  As an administrator
  I want to link a user to a person record
  So that we know which physical person is behind an account

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

  Scenario: POST /represents/ with valid body as admin — the link is created
    Given I am authenticated as an administrator: user.id 0001
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 0020 | Alice      | Dupont    | female | active |
    And the represents table contains:
      | user_id | person_id | status |
    When I POST /api/platform/functions/people/represents/ with body:
      """
      {
        "user_id": "0002",
        "person_id": "0020"
      }
      """
    Then the response status code is 201
    And the represents table contains:
      | user_id | person_id | status |
      | 0002    | 0020      | active |

  Scenario: POST /represents/ with a missing required field — 422 error and the database is not modified
    Given I am authenticated as an administrator: user.id 0001
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 0020 | Alice      | Dupont    | female | active |
    And the represents table contains:
      | user_id | person_id | status |
    When I POST /api/platform/functions/people/represents/ with body:
      """
      {
        "user_id": "0002"
      }
      """
    Then the response status code is 422
    And the represents table contains:
      | user_id | person_id | status |

  @error_case
  Scenario: POST /represents/ as a viewer — 403 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 0020 | Alice      | Dupont    | female | active |
    And the represents table contains:
      | user_id | person_id | status |
    When I POST /api/platform/functions/people/represents/ with body:
      """
      {
        "user_id": "0002",
        "person_id": "0020"
      }
      """
    Then the response status code is 403
    And the represents table contains:
      | user_id | person_id | status |
