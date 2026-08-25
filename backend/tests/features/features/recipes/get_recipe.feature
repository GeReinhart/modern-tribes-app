@wip
Feature: Get a recipe with its ingredients
  As a project member
  I want to see a recipe's full ingredient list
  So that I know what to buy and how to cook it

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
    And the recipes table contains:
      | id   | feature_instance_id | name    | servings | status |
      | 6001 | 0040                | Lasagna | 4        | active |
    And the recipe_ingredients table contains:
      | id   | recipe_id | groceries_item_id | custom_name    | custom_unit | quantity | position | status |
      | 9001 | 6001      | 3001               |                |             | 0.8       | 0        | active |
      | 9002 | 6001      |                    | Lasagna sheets | packs       | 1.0       | 1        | active |

  Scenario: GET /recipes/6001 as a project member — the recipe and its ingredients are returned
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I GET /api/features/tasks/recipes/6001
    Then the response status code is 200
    And the response body includes:
      """
      {
        "id": "6001",
        "name": "Lasagna",
        "servings": 4,
        "ingredients": [
          {"id": "9001", "groceries_item_id": "3001", "name": "Ground beef", "unit": "kg", "is_divisible": true, "quantity": 0.8},
          {"id": "9002", "groceries_item_id": null, "name": "Lasagna sheets", "unit": "packs", "is_divisible": true, "quantity": 1.0}
        ]
      }
      """

  @error_case
  Scenario: GET /recipes/6001 without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tasks/recipes/6001
    Then the response status code is 403

  @error_case
  Scenario: GET /recipes/9999 for an unknown recipe — 404 error
    Given I am authenticated as an administrator: user.id 0001
    When I GET /api/features/tasks/recipes/9999
    Then the response status code is 404
