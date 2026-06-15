Feature: Search indexing for todo items
  As a project member
  I want todo items to be searchable by title and labels
  So that users can find tasks through global search

  Background:
    Given the users table contains:
      | id   | email          | status |
      | 0001 | admin@test.com | active |
    And the roles table contains:
      | name          | status |
      | administrator | active |
    And the role_permissions table contains:
      | role          | permission |
      | administrator | admin      |
    And the user_roles table contains:
      | user           | role          |
      | admin@test.com | administrator |
    And the tribes table contains:
      | id   | name  | url_param_id | status |
      | 0050 | Tribe | tribe1       | active |
    And the projects table contains:
      | id   | name    | url_param_id | status |
      | 0100 | Project | proj1        | active |
    And the tribes_projects table contains:
      | tribe_id | project_id |
      | 0050     | 0100       |
    And the projects_features table contains:
      | id   | project_id | name  | feature_type | status |
      | 0200 | 0100       | Todos | todo_list    | active |

  Scenario: POST /todo-items/ as admin — the item is indexed in search
    Given I am authenticated as an administrator: user.id 0001
    And the todo_items table contains:
      | id | feature_instance_id | title | todo_status | position | status |
    And the search_index table contains:
      | entity_type | entity_id | content_text | status |
    When I POST /api/features/tasks/todo-items/ with body:
      """
      {"feature_instance_id": "0200", "title": "Fix login bug", "position": 0}
      """
    Then the response status code is 201
    And the search_index table contains:
      | entity_type | status |
      | todo_item   | active |

  Scenario: PATCH /todo-items/{id} title update — search index is refreshed
    Given I am authenticated as an administrator: user.id 0001
    And the todo_items table contains:
      | id   | feature_instance_id | title     | todo_status | position | status |
      | 0010 | 0200                | Old title | todo        | 1        | active |
    And the search_index table contains:
      | entity_type | entity_id | content_text | status |
      | todo_item   | 0010      | Old title    | active |
    When I PATCH /api/features/tasks/todo-items/0010 with body:
      """
      {"title": "New title"}
      """
    Then the response status code is 200
    And the search_index table contains:
      | entity_type | entity_id | status |
      | todo_item   | 0010      | active |

  Scenario: POST /todo-items/{id}/labels/{label_id} — label name is added to search index
    Given I am authenticated as an administrator: user.id 0001
    And the todo_items table contains:
      | id   | feature_instance_id | title   | todo_status | position | status |
      | 0010 | 0200                | Fix bug | todo        | 1        | active |
    And the labels table contains:
      | id   | name     | color   | status |
      | 0020 | Frontend | #ff0000 | active |
    And the label_entities table contains:
      | label_id | entity_type | entity_id |
    And the search_index table contains:
      | entity_type | entity_id | content_text | status |
      | todo_item   | 0010      | Fix bug      | active |
    When I POST /api/features/tasks/todo-items/0010/labels/0020
    Then the response status code is 200
    And the label_entities table contains:
      | label_id | entity_type | entity_id |
      | 0020     | todo_item   | 0010      |
    And the search_index table contains:
      | entity_type | entity_id | status |
      | todo_item   | 0010      | active |
