@wip
Feature: Get grocery suggestions from planned meals
  As a project member
  I want a groceries list to suggest ingredients from meals planned after it
  So that I don't forget to buy what upcoming meals need

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
      | 3002 | Eggs        |             | piece | false        | active |
    And the groceries_lists table contains:
      | id   | feature_instance_id | scheduled_date | list_status | status |
      | 8001 | 0042                | 2026-09-01      | planned     | active |

  Scenario: GET /meals/grocery-suggestions/8001 — ingredients of a meal planned after the list are suggested, scaled to its headcount
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
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
      | 7002 | 0041                | Past brunch   | 2026-08-20T10:00:00Z | 2026-08-20T11:00:00Z | 4         | active |
    And the meal_recipes table contains:
      | meal_id | recipe_id |
      | 7001    | 6001      |
      | 7002    | 6001      |
    When I GET /api/features/tasks/meals/grocery-suggestions/8001
    Then the response status code is 200
    And the response body is:
      """
      [
        {
          "meal_id": "7001",
          "meal_title": "Family dinner",
          "meal_start_at": "2026-09-05T19:00:00Z",
          "recipe_id": "6001",
          "recipe_name": "Lasagna",
          "headcount": 8,
          "added": false,
          "ingredients": [
            {"groceries_item_id": "3001", "name": "Ground beef", "unit": "kg", "quantity": 1.6},
            {"groceries_item_id": null, "name": "Lasagna sheets", "unit": "packs", "quantity": 2.0}
          ]
        }
      ]
      """

  Scenario: GET /meals/grocery-suggestions/8001 — quantities for non-divisible items are rounded up
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the recipes table contains:
      | id   | feature_instance_id | name     | servings | status |
      | 6002 | 0040                | Omelette | 4        | active |
    And the recipe_ingredients table contains:
      | id   | recipe_id | groceries_item_id | quantity | status |
      | 9003 | 6002      | 3002               | 3         | active |
    And the meals table contains:
      | id   | feature_instance_id | title          | start_at             | end_at               | headcount | status |
      | 7003 | 0041                | Omelette night | 2026-09-10T19:00:00Z | 2026-09-10T20:00:00Z | 6         | active |
    And the meal_recipes table contains:
      | meal_id | recipe_id |
      | 7003    | 6002      |
    When I GET /api/features/tasks/meals/grocery-suggestions/8001
    Then the response status code is 200
    And the response body is:
      """
      [
        {
          "meal_id": "7003",
          "meal_title": "Omelette night",
          "meal_start_at": "2026-09-10T19:00:00Z",
          "recipe_id": "6002",
          "recipe_name": "Omelette",
          "headcount": 6,
          "added": false,
          "ingredients": [
            {"groceries_item_id": "3002", "name": "Eggs", "unit": "piece", "quantity": 5.0}
          ]
        }
      ]
      """

  Scenario: GET /meals/grocery-suggestions for a list already marked done — no suggestions are returned
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the groceries_lists table contains:
      | id   | feature_instance_id | scheduled_date | list_status | status |
      | 8002 | 0042                | 2026-09-01      | done        | active |
    And the recipes table contains:
      | id   | feature_instance_id | name    | servings | status |
      | 6001 | 0040                | Lasagna | 4        | active |
    And the recipe_ingredients table contains:
      | id   | recipe_id | groceries_item_id | quantity | status |
      | 9001 | 6001      | 3001               | 0.8       | active |
    And the meals table contains:
      | id   | feature_instance_id | title         | start_at             | end_at               | headcount | status |
      | 7001 | 0041                | Family dinner | 2026-09-05T19:00:00Z | 2026-09-05T20:30:00Z | 8         | active |
    And the meal_recipes table contains:
      | meal_id | recipe_id |
      | 7001    | 6001      |
    When I GET /api/features/tasks/meals/grocery-suggestions/8002
    Then the response status code is 200
    And the response body is:
      """
      []
      """

  @error_case
  Scenario: GET /meals/grocery-suggestions/8001 without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tasks/meals/grocery-suggestions/8001
    Then the response status code is 403
