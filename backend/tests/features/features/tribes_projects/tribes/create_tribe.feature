@wip
Feature: Create a tribe
  As an administrator
  I want to create a tribe
  So that people and projects can be grouped together

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

  Scenario: POST /tribes/ with valid body as admin — the tribe is created
    Given I am authenticated as an administrator: user.id 0001
    And the tribes table contains:
      | id | name | status |
    When I POST /api/features/tribes-projects/tribes/ with body:
      """
      {"name": "Engineering"}
      """
    Then the response status code is 201
    And the tribes table contains:
      | name        | status |
      | Engineering | active |

  Scenario: POST /tribes/ with missing name — 422 error and the database is not modified
    Given I am authenticated as an administrator: user.id 0001
    And the tribes table contains:
      | id | name | status |
    When I POST /api/features/tribes-projects/tribes/ with body:
      """
      {}
      """
    Then the response status code is 422
    And the tribes table contains:
      | id | name | status |

  @error_case
  Scenario: POST /tribes/ as a viewer — 403 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the tribes table contains:
      | id | name | status |
    When I POST /api/features/tribes-projects/tribes/ with body:
      """
      {"name": "Engineering"}
      """
    Then the response status code is 403
    And the tribes table contains:
      | id | name | status |
