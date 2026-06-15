Feature: Create a label
  As an administrator
  I want to create a label
  So that it can be used to categorize entities

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

  Scenario: POST /labels/ with valid body as admin — the label is created
    Given I am authenticated as an administrator: user.id 0001
    And the labels table contains:
      | id | name | status |
    When I POST /api/platform/functions/labels/ with body:
      """
      {"name": "Urgent"}
      """
    Then the response status code is 201
    And the labels table contains:
      | name   | status |
      | Urgent | active |

  Scenario: POST /labels/ with missing name — 422 error and the database is not modified
    Given I am authenticated as an administrator: user.id 0001
    And the labels table contains:
      | id | name | status |
    When I POST /api/platform/functions/labels/ with body:
      """
      {}
      """
    Then the response status code is 422
    And the labels table contains:
      | id | name | status |

  @error_case
  Scenario: POST /labels/ as a viewer — 403 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the labels table contains:
      | id | name | status |
    When I POST /api/platform/functions/labels/ with body:
      """
      {"name": "Urgent"}
      """
    Then the response status code is 403
    And the labels table contains:
      | id | name | status |
