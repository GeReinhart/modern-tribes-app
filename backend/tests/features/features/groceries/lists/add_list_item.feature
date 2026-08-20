@wip
Feature: Add an item to a grocery list
  As a project member
  I want to add a catalog item with a quantity to a grocery list
  So that I know what to buy and how much

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
      | id   | name     | description | unit  | is_divisible | status |
      | 3001 | Tomatoes |             | kg    | true         | active |
      | 3002 | Yogurt   |             | piece | false        | active |
    And the groceries_lists table contains:
      | id   | feature_instance_id | name        | scheduled_date | list_status | status |
      | 0201 | 0100                | Weekly shop | 2026-08-22      | planned     | active |

  Scenario: POST /groceries-lists/0201/items as a project member — the item is added to the list
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the groceries_list_items table contains:
      | id | groceries_list_id | groceries_item_id | quantity | picked_up | position | status |
    When I POST /api/features/tasks/groceries-lists/0201/items with body:
      """
      {"groceries_item_id": "3001", "quantity": 2}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "groceries_list_id": "0201",
        "groceries_item_id": "3001",
        "quantity": 2.0,
        "picked_up": false,
        "status": "active"
      }
      """
    And the groceries_list_items table contains:
      | groceries_list_id | groceries_item_id | quantity | picked_up | status |
      | 0201               | 3001               | 2.00      | false     | active |

  @error_case
  Scenario: POST /groceries-lists/0201/items as a project guest — 403 error and the list is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | guest    | active |
    And the groceries_list_items table contains:
      | id | groceries_list_id | groceries_item_id | quantity | picked_up | position | status |
    When I POST /api/features/tasks/groceries-lists/0201/items with body:
      """
      {"groceries_item_id": "3001", "quantity": 2}
      """
    Then the response status code is 403
    And the groceries_list_items table contains:
      | id | groceries_list_id | groceries_item_id | quantity | picked_up | position | status |

  @error_case
  Scenario: POST /groceries-lists/0201/items with an unknown catalog item — 404 error and the list is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the groceries_list_items table contains:
      | id | groceries_list_id | groceries_item_id | quantity | picked_up | position | status |
    When I POST /api/features/tasks/groceries-lists/0201/items with body:
      """
      {"groceries_item_id": "9999", "quantity": 2}
      """
    Then the response status code is 404
    And the groceries_list_items table contains:
      | id | groceries_list_id | groceries_item_id | quantity | picked_up | position | status |

  @error_case
  Scenario: POST /groceries-lists/0201/items with a missing quantity — 422 error and the list is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the groceries_list_items table contains:
      | id | groceries_list_id | groceries_item_id | quantity | picked_up | position | status |
    When I POST /api/features/tasks/groceries-lists/0201/items with body:
      """
      {"groceries_item_id": "3001"}
      """
    Then the response status code is 422
    And the groceries_list_items table contains:
      | id | groceries_list_id | groceries_item_id | quantity | picked_up | position | status |

  @error_case
  Scenario: POST /groceries-lists/0201/items with a fractional quantity for a non-divisible item — 422 error and the list is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the groceries_list_items table contains:
      | id | groceries_list_id | groceries_item_id | quantity | picked_up | position | status |
    When I POST /api/features/tasks/groceries-lists/0201/items with body:
      """
      {"groceries_item_id": "3002", "quantity": 1.5}
      """
    Then the response status code is 422
    And the groceries_list_items table contains:
      | id | groceries_list_id | groceries_item_id | quantity | picked_up | position | status |
