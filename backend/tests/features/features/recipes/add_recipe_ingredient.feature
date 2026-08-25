@wip
Feature: Add an ingredient to a recipe
  As a project member
  I want to add a catalog article or a custom item with a quantity to a recipe
  So that the recipe's shopping needs are known

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
      | id   | project_id | name    | feature_type | status |
      | 0040 | 0100       | Recipes | recipes      | active |
    And the groceries_items table contains:
      | id   | name        | description | unit  | is_divisible | status |
      | 3001 | Ground beef |             | kg    | true         | active |
      | 3002 | Eggs        |             | piece | false        | active |
    And the recipes table contains:
      | id   | feature_instance_id | name    | servings | status |
      | 6001 | 0040                | Lasagna | 4        | active |

  Scenario: POST /recipes/6001/ingredients with a catalog article — the ingredient is added
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the recipe_ingredients table contains:
      | id | recipe_id | groceries_item_id | quantity | position | status |
    When I POST /api/features/tasks/recipes/6001/ingredients with body:
      """
      {"groceries_item_id": "3001", "quantity": 0.8}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "recipe_id": "6001",
        "groceries_item_id": "3001",
        "quantity": 0.8,
        "status": "active"
      }
      """
    And the recipe_ingredients table contains:
      | recipe_id | groceries_item_id | quantity | status |
      | 6001      | 3001               | 0.80      | active |

  Scenario: POST /recipes/6001/ingredients with a custom ingredient not in the catalog — the ingredient is added
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the recipe_ingredients table contains:
      | id | recipe_id | groceries_item_id | custom_name    | custom_unit | quantity | position | status |
    When I POST /api/features/tasks/recipes/6001/ingredients with body:
      """
      {"custom_name": "Lasagna sheets", "custom_unit": "packs", "quantity": 1}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "recipe_id": "6001",
        "groceries_item_id": null,
        "custom_name": "Lasagna sheets",
        "custom_unit": "packs",
        "quantity": 1.0,
        "status": "active"
      }
      """
    And the recipe_ingredients table contains:
      | recipe_id | groceries_item_id | custom_name    | custom_unit | quantity | status |
      | 6001      |                    | Lasagna sheets | packs       | 1.00      | active |

  @error_case
  Scenario: POST /recipes/6001/ingredients with a fractional quantity for a non-divisible item — 422 error and the recipe is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the recipe_ingredients table contains:
      | id | recipe_id | groceries_item_id | quantity | position | status |
    When I POST /api/features/tasks/recipes/6001/ingredients with body:
      """
      {"groceries_item_id": "3002", "quantity": 1.5}
      """
    Then the response status code is 422
    And the recipe_ingredients table contains:
      | id | recipe_id | groceries_item_id | quantity | position | status |

  @error_case
  Scenario: POST /recipes/6001/ingredients with neither a catalog item nor a custom name — 422 error and the recipe is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the recipe_ingredients table contains:
      | id | recipe_id | groceries_item_id | custom_name | quantity | position | status |
    When I POST /api/features/tasks/recipes/6001/ingredients with body:
      """
      {"quantity": 2}
      """
    Then the response status code is 422
    And the recipe_ingredients table contains:
      | id | recipe_id | groceries_item_id | custom_name | quantity | position | status |

  @error_case
  Scenario: POST /recipes/6001/ingredients as a project guest — 403 error and the recipe is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | guest    | active |
    And the recipe_ingredients table contains:
      | id | recipe_id | groceries_item_id | quantity | position | status |
    When I POST /api/features/tasks/recipes/6001/ingredients with body:
      """
      {"groceries_item_id": "3001", "quantity": 0.8}
      """
    Then the response status code is 403
    And the recipe_ingredients table contains:
      | id | recipe_id | groceries_item_id | quantity | position | status |
