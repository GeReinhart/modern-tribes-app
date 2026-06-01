@wip
Feature: Get users assigned to a role
  As an administrator
  I want to retrieve the list of users assigned to a role
  So that I can audit who has a given permission set

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

  Scenario: GET /roles/0010/users as admin — users are returned
    Given I am authenticated as an administrator: user.id 0001
    And the managed_roles table contains:
      | id   | name    | status |
      | 0010 | manager | active |
    When I GET /api/platform/core/authorization/roles/0010/users
    Then the response status code is 200

  @error_case
  Scenario: GET /roles/0010/users as a viewer — 403 error
    Given I am authenticated as a regular user: user.id 0002
    And the managed_roles table contains:
      | id   | name    | status |
      | 0010 | manager | active |
    When I GET /api/platform/core/authorization/roles/0010/users
    Then the response status code is 403
