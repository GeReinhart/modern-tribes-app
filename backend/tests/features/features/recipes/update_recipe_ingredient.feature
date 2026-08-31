@wip
Feature: Update a recipe ingredient
  As a project member
  I want to change an ingredient's quantity, position or accompaniment flag
  So that a recipe's ingredient list stays accurate and ordered the way I want to read it

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
      | id   | name | description | unit  | is_divisible | status |
      | 3002 | Eggs |             | piece | false        | active |
    And the recipes table contains:
      | id   | feature_instance_id | name    | servings | status |
      | 6001 | 0040                | Lasagna | 4        | active |

  Scenario: PATCH /recipe-ingredients/6101 with a new quantity — the quantity is updated
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the recipe_ingredients table contains:
      | id   | recipe_id | custom_name    | custom_unit | quantity | position | status |
      | 6101 | 6001      | Lasagna sheets | packs       | 1.00     | 0        | active |
    When I PATCH /api/features/tasks/recipe-ingredients/6101 with body:
      """
      {"quantity": 2}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "id": "6101",
        "quantity": 2.0
      }
      """
    And the recipe_ingredients table contains:
      | id   | recipe_id | custom_name    | quantity | position | status |
      | 6101 | 6001      | Lasagna sheets | 2.00     | 0        | active |

  Scenario: PATCH /recipe-ingredients/6101 with a display override — the override is set, quantity untouched
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the recipe_ingredients table contains:
      | id   | recipe_id | custom_name | custom_unit | quantity | position | status |
      | 6101 | 6001      | Salt        | kg          | 0.03      | 0        | active |
    When I PATCH /api/features/tasks/recipe-ingredients/6101 with body:
      """
      {"display_override": "a pinch"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "id": "6101",
        "quantity": 0.03,
        "display_override": "a pinch"
      }
      """
    And the recipe_ingredients table contains:
      | id   | recipe_id | custom_name | quantity | display_override | status |
      | 6101 | 6001      | Salt        | 0.03      | a pinch           | active |

  Scenario: PATCH /recipe-ingredients/6101 clearing the display override — the recipe shows quantity again
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the recipe_ingredients table contains:
      | id   | recipe_id | custom_name | custom_unit | quantity | display_override | position | status |
      | 6101 | 6001      | Salt        | kg          | 0.03      | a pinch           | 0        | active |
    When I PATCH /api/features/tasks/recipe-ingredients/6101 with body:
      """
      {"display_override": null}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "id": "6101",
        "display_override": null
      }
      """
    And the recipe_ingredients table contains:
      | id   | recipe_id | custom_name | quantity | display_override | status |
      | 6101 | 6001      | Salt        | 0.03      |                   | active |

  Scenario: PATCH /recipe-ingredients/6101 and 6102 to swap positions — the ingredients are reordered
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the recipe_ingredients table contains:
      | id   | recipe_id | custom_name    | quantity | position | status |
      | 6101 | 6001      | Lasagna sheets | 1.00     | 0        | active |
      | 6102 | 6001      | Garlic bread   | 1.00     | 1        | active |
    When I PATCH /api/features/tasks/recipe-ingredients/6101 with body:
      """
      {"position": 1}
      """
    Then the response status code is 200
    When I PATCH /api/features/tasks/recipe-ingredients/6102 with body:
      """
      {"position": 0}
      """
    Then the response status code is 200
    And the recipe_ingredients table contains:
      | id   | recipe_id | custom_name    | quantity | position | status |
      | 6101 | 6001      | Lasagna sheets | 1.00     | 1        | active |
      | 6102 | 6001      | Garlic bread   | 1.00     | 0        | active |

  @error_case
  Scenario: PATCH /recipe-ingredients/6103 with a fractional quantity for a non-divisible item — 422 error and the ingredient is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the recipe_ingredients table contains:
      | id   | recipe_id | groceries_item_id | quantity | position | status |
      | 6103 | 6001      | 3002               | 1.00     | 0        | active |
    When I PATCH /api/features/tasks/recipe-ingredients/6103 with body:
      """
      {"quantity": 1.5}
      """
    Then the response status code is 422
    And the recipe_ingredients table contains:
      | id   | recipe_id | groceries_item_id | quantity | position | status |
      | 6103 | 6001      | 3002               | 1.00     | 0        | active |

  @error_case
  Scenario: PATCH /recipe-ingredients/6101 as a project guest — 403 error and the ingredient is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | guest    | active |
    And the recipe_ingredients table contains:
      | id   | recipe_id | custom_name    | quantity | position | status |
      | 6101 | 6001      | Lasagna sheets | 1.00     | 0        | active |
    When I PATCH /api/features/tasks/recipe-ingredients/6101 with body:
      """
      {"quantity": 2}
      """
    Then the response status code is 403
    And the recipe_ingredients table contains:
      | id   | recipe_id | custom_name    | quantity | position | status |
      | 6101 | 6001      | Lasagna sheets | 1.00     | 0        | active |

  @error_case
  Scenario: PATCH /recipe-ingredients/9999 on a non-existent ingredient — 404 error
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I PATCH /api/features/tasks/recipe-ingredients/9999 with body:
      """
      {"quantity": 2}
      """
    Then the response status code is 404
