@wip
Feature: Toggle a label on a todo item
  As an administrator
  I want to toggle a label on a todo item
  So that the item is properly categorised

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

  Scenario: POST /todo-items/0010/labels/0020 as admin — label is toggled on todo item
    Given I am authenticated as an administrator: user.id 0001
    When I POST /api/features/tasks/todo-items/0010/labels/0020
    Then the response status code is 200

  @error_case
  Scenario: POST /todo-items/0010/labels/0020 as a viewer without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I POST /api/features/tasks/todo-items/0010/labels/0020
    Then the response status code is 403
