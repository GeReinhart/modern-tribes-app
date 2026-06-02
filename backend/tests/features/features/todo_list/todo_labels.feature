@wip
Feature: Manage todo labels
  As an administrator
  I want to manage labels for a todo list instance
  So that todo items can be categorised

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
    And the labels table contains:
      | id   | name    | color    | status | feature_instance_id |
      | 0010 | Bug     | #ff0000  | active | 0100                |

  Scenario: GET /todo-labels/by-instance/0100 as admin — labels are returned
    Given I am authenticated as an administrator: user.id 0001
    When I GET /api/features/tasks/todo-labels/by-instance/0100
    Then the response status code is 200
    And the response body is:
      """
      [{"id": "0010", "name": "Bug", "color": "#ff0000", "position": 0}]
      """

  Scenario: POST /todo-labels/ as admin — label is created
    Given I am authenticated as an administrator: user.id 0001
    When I POST /api/features/tasks/todo-labels/ with body:
      """
      {"feature_instance_id": "0100", "name": "Feature", "color": "#0000ff"}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {"name": "Feature", "color": "#0000ff", "position": 1}
      """

  Scenario: PATCH /todo-labels/0010 as admin — label is updated
    Given I am authenticated as an administrator: user.id 0001
    When I PATCH /api/features/tasks/todo-labels/0010 with body:
      """
      {"name": "Feature"}
      """
    Then the response status code is 204

  @error_case
  Scenario: POST /todo-labels/ as a viewer without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I POST /api/features/tasks/todo-labels/ with body:
      """
      {"feature_instance_id": "0100", "name": "Bug", "color": "#ff0000"}
      """
    Then the response status code is 403
