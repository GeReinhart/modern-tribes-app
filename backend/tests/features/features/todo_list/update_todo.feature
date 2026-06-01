@wip
Feature: Update a todo item
  As a project member
  I want to update a todo item's title or status
  So that the task information stays current

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

  Scenario: PATCH /todo-items/0010 as admin — the item is updated
    Given I am authenticated as an administrator: user.id 0001
    When I PATCH /api/features/tasks/todo-items/0010 with body:
      """
      {"title": "Write tests — updated"}
      """
    Then the response status code is 200

  @error_case
  Scenario: PATCH /todo-items/0010 as a viewer without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I PATCH /api/features/tasks/todo-items/0010 with body:
      """
      {"title": "Write tests — updated"}
      """
    Then the response status code is 403
