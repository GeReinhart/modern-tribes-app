Feature: Archive a todo item
  As a project member
  I want to archive a todo item
  So that completed or cancelled tasks are removed from the list

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

  Scenario: DELETE /todo-items/0010 as admin — the item is archived
    Given I am authenticated as an administrator: user.id 0001
    And the todo_items table contains:
      | id   | feature_instance_id | title | todo_status | position | status |
      | 0010 | 0100                | Task  | todo        | 1        | active |
    When I DELETE /api/features/tasks/todo-items/0010
    Then the response status code is 204
    And the todo_items table contains:
      | id | feature_instance_id | title | todo_status | position | status |

  @error_case
  Scenario: DELETE /todo-items/0010 as a viewer without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    And the todo_items table contains:
      | id   | feature_instance_id | title | todo_status | position | status |
      | 0010 | 0100                | Task  | todo        | 1        | active |
    When I DELETE /api/features/tasks/todo-items/0010
    Then the response status code is 403
    And the todo_items table contains:
      | id   | feature_instance_id | title | todo_status | position | status |
      | 0010 | 0100                | Task  | todo        | 1        | active |
