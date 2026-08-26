@wip
Feature: Add a suggested meal's ingredients to a groceries list
  As a project member
  I want to add all of a suggested meal's ingredients to my list in one action
  So that I don't have to add them one by one

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
      | 0040 | 0100       | Recipes   | recipes      | active |
      | 0041 | 0100       | Meals     | meals        | active |
      | 0042 | 0100       | Groceries | groceries    | active |
    And the groceries_items table contains:
      | id   | name        | description | unit  | is_divisible | status |
      | 3001 | Ground beef |             | kg    | true         | active |
    And the groceries_lists table contains:
      | id   | feature_instance_id | scheduled_date | list_status | status |
      | 8001 | 0042                | 2026-09-01      | planned     | active |
    And the recipes table contains:
      | id   | feature_instance_id | name    | servings | status |
      | 6001 | 0040                | Lasagna | 4        | active |
    And the recipe_ingredients table contains:
      | id   | recipe_id | groceries_item_id | custom_name    | custom_unit | quantity | status |
      | 9001 | 6001      | 3001               |                |             | 0.8       | active |
      | 9002 | 6001      |                    | Lasagna sheets | packs       | 1.0       | active |
    And the meals table contains:
      | id   | feature_instance_id | title         | start_at             | end_at               | headcount | status |
      | 7001 | 0041                | Family dinner | 2026-09-05T19:00:00Z | 2026-09-05T20:30:00Z | 8         | active |
    And the meal_recipes table contains:
      | meal_id | recipe_id |
      | 7001    | 6001      |

  Scenario: POST /meals/grocery-suggestions/8001/add/7001 as a project member — all ingredients are added and the meal is marked added
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the groceries_list_items table contains:
      | id | groceries_list_id | groceries_item_id | custom_name | custom_unit | quantity | position | status |
    And the groceries_list_meals table contains:
      | id | groceries_list_id | meal_id | headcount | status |
    When I POST /api/features/tasks/meals/grocery-suggestions/8001/add/7001
    Then the response status code is 204
    And the groceries_list_items table contains:
      | groceries_list_id | groceries_item_id | custom_name    | custom_unit | quantity | status |
      | 8001               | 3001               |                |             | 1.60      | active |
      | 8001               |                    | Lasagna sheets | packs       | 2.00      | active |
    And the groceries_list_meals table contains:
      | groceries_list_id | meal_id | headcount | status |
      | 8001               | 7001    | 8         | active |

  Scenario: POST /meals/grocery-suggestions/8001/add/7001 — an ingredient already on the list has its quantity increased instead of being duplicated
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the groceries_list_items table contains:
      | id   | groceries_list_id | groceries_item_id | custom_name | custom_unit | quantity | position | status |
      | 4001 | 8001               | 3001               |             |             | 0.50      | 0        | active |
    And the groceries_list_meals table contains:
      | id | groceries_list_id | meal_id | headcount | status |
    When I POST /api/features/tasks/meals/grocery-suggestions/8001/add/7001
    Then the response status code is 204
    And the groceries_list_items table contains:
      | groceries_list_id | groceries_item_id | custom_name    | custom_unit | quantity | status |
      | 8001               | 3001               |                |             | 2.10      | active |
      | 8001               |                    | Lasagna sheets | packs       | 2.00      | active |

  @error_case
  Scenario: POST /meals/grocery-suggestions/8001/add/7001 when the meal was already added — 400 error and nothing changes
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the groceries_list_meals table contains:
      | id   | groceries_list_id | meal_id | headcount | status |
      | 5001 | 8001               | 7001    | 8         | active |
    And the groceries_list_items table contains:
      | id | groceries_list_id | groceries_item_id | custom_name | custom_unit | quantity | position | status |
    When I POST /api/features/tasks/meals/grocery-suggestions/8001/add/7001
    Then the response status code is 400
    And the groceries_list_items table contains:
      | id | groceries_list_id | groceries_item_id | custom_name | custom_unit | quantity | position | status |

  @error_case
  Scenario: POST /meals/grocery-suggestions/8001/add/7001 as a project guest — 403 error and nothing changes
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | guest    | active |
    And the groceries_list_items table contains:
      | id | groceries_list_id | groceries_item_id | custom_name | custom_unit | quantity | position | status |
    When I POST /api/features/tasks/meals/grocery-suggestions/8001/add/7001
    Then the response status code is 403
    And the groceries_list_items table contains:
      | id | groceries_list_id | groceries_item_id | custom_name | custom_unit | quantity | position | status |

  Scenario: GET /meals/grocery-suggestions/8001 — an already-added meal is still listed, flagged as added
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the groceries_list_meals table contains:
      | id   | groceries_list_id | meal_id | headcount | status |
      | 5001 | 8001               | 7001    | 8         | active |
    When I GET /api/features/tasks/meals/grocery-suggestions/8001
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"meal_id": "7001", "recipe_id": "6001", "added": true}
      ]
      """
