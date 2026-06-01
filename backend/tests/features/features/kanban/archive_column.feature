@wip
Feature: Archive a kanban column
  As a project manager
  I want to delete a kanban column
  So that obsolete stages are removed from the board

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

  Scenario: DELETE /kanban/columns/0010 as admin — the column is deleted
    Given I am authenticated as an administrator: user.id 0001
    When I DELETE /api/features/tasks/kanban/columns/0010
    Then the response status code is 204

  @error_case
  Scenario: DELETE /kanban/columns/0010 as a viewer without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I DELETE /api/features/tasks/kanban/columns/0010
    Then the response status code is 403
