Feature: Create an app config entry
  As an administrator
  I want to create a configuration key-value pair
  So that application behaviour can be tuned at runtime

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

  Scenario: POST /app-config/ with valid body as admin — the entry is created
    Given I am authenticated as an administrator: user.id 0001
    And the app_config table contains:
      | id | key | value |
    When I POST /api/platform/core/app-config/ with body:
      """
      {"key": "max_tribes", "value": "10"}
      """
    Then the response status code is 201
    And the app_config table contains:
      | key        | value |
      | max_tribes | 10    |

  Scenario: POST /app-config/ with missing key — 422 error and the database is not modified
    Given I am authenticated as an administrator: user.id 0001
    And the app_config table contains:
      | id | key | value |
    When I POST /api/platform/core/app-config/ with body:
      """
      {"value": "10"}
      """
    Then the response status code is 422
    And the app_config table contains:
      | id | key | value |

  @error_case
  Scenario: POST /app-config/ as a viewer — 403 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the app_config table contains:
      | id | key | value |
    When I POST /api/platform/core/app-config/ with body:
      """
      {"key": "max_tribes", "value": "10"}
      """
    Then the response status code is 403
    And the app_config table contains:
      | id | key | value |
