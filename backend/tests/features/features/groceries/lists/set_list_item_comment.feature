@wip
Feature: Add a comment to a grocery list item
  As a project member
  I want to leave a note on a shopping list item
  So that other shoppers see details like a preferred brand or size

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
    And the persons table contains:
      | id   | first_name | last_name | status |
      | 0030 | Mia        | Member    | active |
    And the users table contains:
      | id   | email         | person_id | status |
      | 0002 | user@test.com | 0030      | active |
    And the tribes table contains:
      | id   | name | status |
      | 0010 | Home | active |
    And the projects table contains:
      | id   | name    | status |
      | 0100 | Project | active |
    And the tribes_projects table contains:
      | tribe_id | project_id | relation |
      | 0010     | 0100       | manager  |
    And the projects_features table contains:
      | id   | project_id | name      | feature_type | status |
      | 0100 | 0100       | Groceries | groceries    | active |
    And the groceries_items table contains:
      | id   | name     | description | unit | is_divisible | status |
      | 3001 | Tomatoes |             | kg   | true         | active |
    And the groceries_lists table contains:
      | id   | feature_instance_id | name        | scheduled_date | list_status | status |
      | 0201 | 0100                | Weekly shop | 2026-08-22      | planned     | active |

  Scenario: PATCH /groceries-list-items/4001 to add a comment — the comment is saved
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the groceries_list_items table contains:
      | id   | groceries_list_id | groceries_item_id | quantity | picked_up | comment | position | status |
      | 4001 | 0201               | 3001               | 2.00      | false     |         | 1        | active |
    When I PATCH /api/features/tasks/groceries-list-items/4001 with body:
      """
      {"comment": "Get the organic ones if available"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "id": "4001",
        "groceries_list_id": "0201",
        "groceries_item_id": "3001",
        "comment": "Get the organic ones if available",
        "quantity": 2.0,
        "picked_up": false,
        "status": "active"
      }
      """
    And the groceries_list_items table contains:
      | id   | groceries_list_id | groceries_item_id | quantity | comment                             | status |
      | 4001 | 0201               | 3001               | 2.00      | Get the organic ones if available   | active |

  Scenario: PATCH /groceries-list-items/4001 to clear a comment — the comment is removed
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the groceries_list_items table contains:
      | id   | groceries_list_id | groceries_item_id | quantity | picked_up | comment          | position | status |
      | 4001 | 0201               | 3001               | 2.00      | false     | Buy the big pack | 1        | active |
    When I PATCH /api/features/tasks/groceries-list-items/4001 with body:
      """
      {"comment": ""}
      """
    Then the response status code is 200
    And the groceries_list_items table contains:
      | id   | groceries_list_id | groceries_item_id | quantity | comment | status |
      | 4001 | 0201               | 3001               | 2.00      |         | active |

  @error_case
  Scenario: PATCH /groceries-list-items/4001 with a comment as a project guest — 403 error and the comment is not saved
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | guest    | active |
    And the groceries_list_items table contains:
      | id   | groceries_list_id | groceries_item_id | quantity | picked_up | comment | position | status |
      | 4001 | 0201               | 3001               | 2.00      | false     |         | 1        | active |
    When I PATCH /api/features/tasks/groceries-list-items/4001 with body:
      """
      {"comment": "Get the organic ones if available"}
      """
    Then the response status code is 403
    And the groceries_list_items table contains:
      | id   | groceries_list_id | groceries_item_id | quantity | comment | status |
      | 4001 | 0201               | 3001               | 2.00      |         | active |
