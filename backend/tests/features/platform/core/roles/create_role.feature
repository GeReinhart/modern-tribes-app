@wip
Feature: Create a role
  As an administrator
  I want to create a role
  So that permissions can be assigned to users through it

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

  Scenario: POST /roles/ with valid body as admin — the role is created
    Given I am authenticated as an administrator: user.id 0001
    And the managed_roles table contains:
      | id | name | status |
    When I POST /api/platform/core/authorization/roles/ with body:
      """
      {"name": "editor"}
      """
    Then the response status code is 201
    And the managed_roles table contains:
      | name   | status |
      | editor | active |

  Scenario: POST /roles/ with missing name — 422 error and the database is not modified
    Given I am authenticated as an administrator: user.id 0001
    And the managed_roles table contains:
      | id | name | status |
    When I POST /api/platform/core/authorization/roles/ with body:
      """
      {}
      """
    Then the response status code is 422
    And the managed_roles table contains:
      | id | name | status |

  @error_case
  Scenario: POST /roles/ as a viewer — 403 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the managed_roles table contains:
      | id | name | status |
    When I POST /api/platform/core/authorization/roles/ with body:
      """
      {"name": "editor"}
      """
    Then the response status code is 403
    And the managed_roles table contains:
      | id | name | status |
