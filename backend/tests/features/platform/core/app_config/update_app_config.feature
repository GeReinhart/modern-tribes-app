@wip
Feature: Update an app config entry
  As an administrator
  I want to update a configuration value
  So that application behaviour can be adjusted

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

  Scenario: PUT /app-config/0010 with valid body as admin — the entry is updated
    Given I am authenticated as an administrator: user.id 0001
    And the app_config table contains:
      | id   | key        | value |
      | 0010 | max_tribes | 10    |
    When I PUT /api/platform/core/app-config/0010 with body:
      """
      {"value": "20"}
      """
    Then the response status code is 200
    And the app_config table contains:
      | id   | key        | value |
      | 0010 | max_tribes | 20    |

  @error_case
  Scenario: PUT /app-config/0010 as a viewer — 403 error and the entry is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the app_config table contains:
      | id   | key        | value |
      | 0010 | max_tribes | 10    |
    When I PUT /api/platform/core/app-config/0010 with body:
      """
      {"value": "20"}
      """
    Then the response status code is 403
    And the app_config table contains:
      | id   | key        | value |
      | 0010 | max_tribes | 10    |
