@wip
Feature: List recipes for a feature instance, with search and ingredient filters
  As a project member
  I want to search the recipe book by name or ingredient, and filter by a specific ingredient
  So that I can quickly find a recipe I'm looking for

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
      | id   | name        | description | unit | is_divisible | status |
      | 3001 | Ground beef |             | kg   | true         | active |
    And the recipes table contains:
      | id   | feature_instance_id | name          | servings | status |
      | 6001 | 0040                | Lasagna       | 4        | active |
      | 6002 | 0040                | Tiramisu      | 6        | active |
      | 6003 | 0040                | Shepherd's pie | 4        | active |
    And the recipe_ingredients table contains:
      | id   | recipe_id | groceries_item_id | quantity | position | status |
      | 6301 | 6003      | 3001               | 0.5      | 0        | active |

  Scenario: GET /recipes/by-instance/0040 with no filters — every active recipe is returned
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I GET /api/features/tasks/recipes/by-instance/0040
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"id": "6001", "name": "Lasagna"},
        {"id": "6003", "name": "Shepherd's pie"},
        {"id": "6002", "name": "Tiramisu"}
      ]
      """

  Scenario: GET /recipes/by-instance/0040 with q matching a recipe's name — only that recipe is returned
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I GET /api/features/tasks/recipes/by-instance/0040?q=lasa
    Then the response status code is 200
    And the response body is:
      """
      [
        {"id": "6001", "feature_instance_id": "0040", "name": "Lasagna", "servings": 4, "document_id": null, "document_content_html": null, "status": "active", "recipe_state": "draft", "label_ids": []}
      ]
      """

  Scenario: GET /recipes/by-instance/0040 with q matching only an ingredient's name — the recipe using it is returned
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I GET /api/features/tasks/recipes/by-instance/0040?q=beef
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"id": "6003", "name": "Shepherd's pie"}
      ]
      """

  Scenario: GET /recipes/by-instance/0040 filtered by ingredient_id — only recipes using that ingredient are returned
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I GET /api/features/tasks/recipes/by-instance/0040?ingredient_id=3001
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"id": "6003", "name": "Shepherd's pie"}
      ]
      """

  Scenario: GET /recipes/by-instance/0040 with a q matching nothing — an empty list is returned
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I GET /api/features/tasks/recipes/by-instance/0040?q=pineapple
    Then the response status code is 200
    And the response body is:
      """
      []
      """

  @error_case
  Scenario: GET /recipes/by-instance/0040 without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tasks/recipes/by-instance/0040
    Then the response status code is 403
