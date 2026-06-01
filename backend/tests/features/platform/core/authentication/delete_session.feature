@wip
Feature: Delete a user session
  As an authenticated user
  I want to delete one of my sessions
  So that I can revoke access from a device

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

  Scenario: DELETE /authentication/sessions/0010 as admin — session is deleted
    Given I am authenticated as an administrator: user.id 0001
    When I DELETE /api/platform/core/authentication/sessions/0010
    Then the response status code is 200

  Scenario: DELETE /authentication/sessions/0010 as a regular user — session is deleted
    Given I am authenticated as a regular user: user.id 0002
    When I DELETE /api/platform/core/authentication/sessions/0010
    Then the response status code is 200
