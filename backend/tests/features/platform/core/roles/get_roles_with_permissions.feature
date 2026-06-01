@wip
Feature: Get roles with permissions
  As an administrator
  I want to retrieve all roles together with their permissions
  So that I can audit the authorization configuration

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

  Scenario: GET /roles/with/permissions as admin — roles with permissions are returned
    Given I am authenticated as an administrator: user.id 0001
    When I GET /api/platform/core/authorization/roles/with/permissions
    Then the response status code is 200

  @error_case
  Scenario: GET /roles/with/permissions as a viewer — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/platform/core/authorization/roles/with/permissions
    Then the response status code is 403
