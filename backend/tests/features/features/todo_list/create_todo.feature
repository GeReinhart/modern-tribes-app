@wip
Feature: Create a todo item
  As a project member
  I want to create a todo item
  So that a task is tracked in the list

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

  Scenario: POST /todo-items/ as admin — the item is created
    Given I am authenticated as an administrator: user.id 0001
    When I POST /api/features/tasks/todo-items/ with body:
      """
      {"feature_instance_id": "0100", "title": "Write tests"}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "feature_instance_id": "0100",
        "title": "Write tests",
        "status": "active",
        "todo_status": "todo",
        "position": 0,
        "label_ids": []
      }
      """

  @error_case
  Scenario: POST /todo-items/ as a viewer without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I POST /api/features/tasks/todo-items/ with body:
      """
      {"feature_instance_id": "0100", "title": "Write tests"}
      """
    Then the response status code is 403
