Feature: Archive an app config entry
  As an administrator
  I want to archive a configuration entry
  So that obsolete settings are removed

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

  Scenario: DELETE /app-config/0010 as admin — entry is archived
    Given I am authenticated as an administrator: user.id 0001
    And the app_config table contains:
      | id   | key        | value |
      | 0010 | max_tribes | 10    |
    When I DELETE /api/platform/core/app-config/0010
    Then the response status code is 204

  @error_case
  Scenario: DELETE /app-config/0010 as a viewer — 403 error and the entry is not archived
    Given I am authenticated as a regular user: user.id 0002
    And the app_config table contains:
      | id   | key        | value |
      | 0010 | max_tribes | 10    |
    When I DELETE /api/platform/core/app-config/0010
    Then the response status code is 403
    And the app_config table contains:
      | key        | value |
      | max_tribes | 10    |
