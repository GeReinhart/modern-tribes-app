Feature: Create a project
  As an administrator
  I want to create a project
  So that work can be organised under tribes

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

  Scenario: POST /projects/ with valid body as admin — the project is created
    Given I am authenticated as an administrator: user.id 0001
    And the projects table contains:
      | id | name | status |
    When I POST /api/features/tribes-projects/projects/ with body:
      """
      {"name": "Website Redesign"}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "name": "Website Redesign",
        "status": "active"
      }
      """
    And the projects table contains:
      | name             | status |
      | Website Redesign | active |

  Scenario: POST /projects/ with missing name — 422 error and the database is not modified
    Given I am authenticated as an administrator: user.id 0001
    And the projects table contains:
      | id | name | status |
    When I POST /api/features/tribes-projects/projects/ with body:
      """
      {}
      """
    Then the response status code is 422
    And the projects table contains:
      | id | name | status |

  @error_case
  Scenario: POST /projects/ as a viewer — 403 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the projects table contains:
      | id | name | status |
    When I POST /api/features/tribes-projects/projects/ with body:
      """
      {"name": "Website Redesign"}
      """
    Then the response status code is 403
    And the projects table contains:
      | id | name | status |
