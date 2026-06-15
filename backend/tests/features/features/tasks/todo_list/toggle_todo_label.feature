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
      | id   | name    | color    | status |
      | 0020 | Bug     | #ff0000  | active |

  Scenario: POST /todo-items/0010/labels/0020 as admin — label is toggled on todo item
    Given I am authenticated as an administrator: user.id 0001
    And the label_entities table contains:
      | label_id | entity_type | entity_id |
    When I POST /api/features/tasks/todo-items/0010/labels/0020
    Then the response status code is 200
    And the response body is:
      """
      ["0020"]
      """
    And the label_entities table contains:
      | label_id | entity_type | entity_id |
      | 0020     | todo_item   | 0010      |

  @error_case
  Scenario: POST /todo-items/0010/labels/0020 as a viewer without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    And the label_entities table contains:
      | label_id | entity_type | entity_id |
    When I POST /api/features/tasks/todo-items/0010/labels/0020
    Then the response status code is 403
    And the label_entities table contains:
      | label_id | entity_type | entity_id |
