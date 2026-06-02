@wip
Feature: List todo items
  As an administrator
  I want to list the todo items for a feature instance
  So that I can review the tasks in that list

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

  Scenario: GET /todo-items/by-instance/0100 as admin — todo items are returned
    Given I am authenticated as an administrator: user.id 0001
    And the todo_items table contains:
      | id   | feature_instance_id | title    | todo_status | position | status |
      | 1001 | 0100                | Buy milk | todo        | 1        | active |
    When I GET /api/features/tasks/todo-items/by-instance/0100
    Then the response status code is 200
    And the response body includes:
      """
      [
        {
          "id": "1001",
          "feature_instance_id": "0100",
          "title": "Buy milk",
          "status": "active",
          "todo_status": "todo",
          "position": 1
        }
      ]
      """

  @error_case
  Scenario: GET /todo-items/by-instance/0100 as a viewer without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tasks/todo-items/by-instance/0100
    Then the response status code is 403
