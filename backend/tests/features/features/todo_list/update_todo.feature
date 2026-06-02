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
    And the projects table contains:
      | id   | name    | status |
      | 0100 | Project | active |
    And the projects_features table contains:
      | id   | project_id | name  | feature_type | status |
      | 0100 | 0100       | Todos | todo         | active |
    And the todo_items table contains:
      | id   | feature_instance_id | title | todo_status | position | status |
      | 0010 | 0100                | Task  | todo        | 1        | active |

  Scenario: PATCH /todo-items/0010 as admin — the item is updated
    Given I am authenticated as an administrator: user.id 0001
    When I PATCH /api/features/tasks/todo-items/0010 with body:
      """
      {"title": "Write tests — updated"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "id": "0010",
        "feature_instance_id": "0100",
        "title": "Write tests — updated",
        "status": "active",
        "todo_status": "todo",
        "position": 1
      }
      """

  @error_case
  Scenario: PATCH /todo-items/0010 as a viewer without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I PATCH /api/features/tasks/todo-items/0010 with body:
      """
      {"title": "Write tests — updated"}
      """
    Then the response status code is 403
