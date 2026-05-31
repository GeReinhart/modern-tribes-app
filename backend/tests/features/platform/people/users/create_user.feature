@wip
Feature: Create a user
  As an administrator
  I want to create a user account
  So that they can access the platform

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

  Scenario: POST /users/ with a valid body as admin — the new record appears in the database
    Given I am authenticated as an administrator: user.id 0001
    And the created_users table contains:
      | login | email | status |
    When I POST /api/platform/functions/people/users/ with body:
      """
      {
        "login": "bob",
        "email": "bob@test.com"
      }
      """
    Then the response status code is 201
    And the created_users table contains:
      | login | email        | status |
      | bob   | bob@test.com | active |

  Scenario: POST /users/ with a missing required field — 422 error and the database is not modified
    Given I am authenticated as an administrator: user.id 0001
    And the created_users table contains:
      | login | email | status |
    When I POST /api/platform/functions/people/users/ with body:
      """
      {
        "login": "bob"
      }
      """
    Then the response status code is 422
    And the created_users table contains:
      | login | email | status |

  @error_case
  Scenario: POST /users/ as a viewer — 403 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the created_users table contains:
      | login | email | status |
    When I POST /api/platform/functions/people/users/ with body:
      """
      {
        "login": "bob",
        "email": "bob@test.com"
      }
      """
    Then the response status code is 403
    And the created_users table contains:
      | login | email | status |
