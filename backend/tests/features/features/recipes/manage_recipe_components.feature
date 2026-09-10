@wip
Feature: Compose a recipe from another recipe
  As a project member
  I want to reuse an existing recipe as a component of another recipe (e.g. a Tarte using a
  Pâte à Tarte), with its own multiplier
  So that I don't have to duplicate a sub-recipe's ingredients every time it's reused

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
    And the recipes table contains:
      | id   | feature_instance_id | name           | servings | status |
      | 6001 | 0040                 | Tarte          | 4        | active |
      | 6002 | 0040                 | Pâte à Tarte   | 6        | active |
      | 6003 | 0040                 | Tarte au thon  | 4        | active |

  Scenario: POST /recipes/6001/components with a valid body — the component link appears
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the recipe_components table contains:
      | id | parent_recipe_id | component_recipe_id | multiplier | position | status |
    When I POST /api/features/tasks/recipes/6001/components with body:
      """
      { "component_recipe_id": "6002", "multiplier": 2 }
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "parent_recipe_id": "6001",
        "component_recipe_id": "6002",
        "component_recipe_name": "Pâte à Tarte",
        "multiplier": 2.0
      }
      """
    And the recipe_components table contains:
      | parent_recipe_id | component_recipe_id | multiplier | position | status |
      | 6001              | 6002                  | 2.00        | 0        | active |

  Scenario: POST /recipes/6001/components with the recipe itself as the component — 422 error, no link created
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the recipe_components table contains:
      | id | parent_recipe_id | component_recipe_id | multiplier | position | status |
    When I POST /api/features/tasks/recipes/6001/components with body:
      """
      { "component_recipe_id": "6001", "multiplier": 1 }
      """
    Then the response status code is 422
    And the recipe_components table contains:
      | parent_recipe_id | component_recipe_id | multiplier | position | status |

  Scenario: POST /recipes/6001/components with an unknown component recipe — 404 error, no link created
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the recipe_components table contains:
      | id | parent_recipe_id | component_recipe_id | multiplier | position | status |
    When I POST /api/features/tasks/recipes/6001/components with body:
      """
      { "component_recipe_id": "9999", "multiplier": 1 }
      """
    Then the response status code is 404
    And the recipe_components table contains:
      | parent_recipe_id | component_recipe_id | multiplier | position | status |

  Scenario: POST /recipes/6001/components with a component that already has its own component — 422 error, no link created
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the recipe_components table contains:
      | id   | parent_recipe_id | component_recipe_id | multiplier | position | status |
      | 8001 | 6003               | 6002                  | 1.00        | 0        | active |
    When I POST /api/features/tasks/recipes/6001/components with body:
      """
      { "component_recipe_id": "6003", "multiplier": 1 }
      """
    Then the response status code is 422
    And the recipe_components table contains:
      | parent_recipe_id | component_recipe_id | multiplier | position | status |
      | 6003               | 6002                  | 1.00        | 0        | active |

  @error_case
  Scenario: POST /recipes/6001/components as a project guest — 403 error, no link created
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | guest    | active |
    And the recipe_components table contains:
      | id | parent_recipe_id | component_recipe_id | multiplier | position | status |
    When I POST /api/features/tasks/recipes/6001/components with body:
      """
      { "component_recipe_id": "6002", "multiplier": 1 }
      """
    Then the response status code is 403
    And the recipe_components table contains:
      | parent_recipe_id | component_recipe_id | multiplier | position | status |

  Scenario: GET /recipes/6001 with a component — the component's ingredients are scaled by its multiplier and its own description is included
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the documents table contains:
      | id   | content_html                 | status |
      | 0500 | <p>Blind-bake the base.</p> | active |
    And the recipes table contains:
      | id   | feature_instance_id | name         | servings | document_id | status |
      | 6002 | 0040                 | Pâte à Tarte | 6        | 0500        | active |
    And the recipe_ingredients table contains:
      | id   | recipe_id | groceries_item_id | custom_name | custom_unit | quantity | position | status |
      | 9001 | 6001       |                    | Pommes       | kg           | 1.0       | 0        | active |
      | 9002 | 6002       |                    | Farine       | gram         | 300.0     | 0        | active |
    And the recipe_components table contains:
      | id   | parent_recipe_id | component_recipe_id | multiplier | position | status |
      | 8001 | 6001               | 6002                  | 2.00        | 0        | active |
    When I GET /api/features/tasks/recipes/6001
    Then the response status code is 200
    And the response body includes:
      """
      {
        "id": "6001",
        "ingredients": [
          {"id": "9001", "name": "Pommes", "quantity": 1.0}
        ],
        "components": [
          {
            "id": "8001",
            "component_recipe_id": "6002",
            "component_recipe_name": "Pâte à Tarte",
            "multiplier": 2.0,
            "document_content_html": "<p>Blind-bake the base.</p>",
            "ingredients": [
              {"id": "9002", "name": "Farine", "quantity": 600.0}
            ]
          }
        ]
      }
      """

  Scenario: DELETE /recipe-components/8001 — the component link is removed
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the recipe_components table contains:
      | id   | parent_recipe_id | component_recipe_id | multiplier | position | status |
      | 8001 | 6001               | 6002                  | 2.00        | 0        | active |
    When I DELETE /api/features/tasks/recipe-components/8001
    Then the response status code is 204
    And the recipe_components table contains:
      | id | parent_recipe_id | component_recipe_id | multiplier | position | status |

  @error_case
  Scenario: DELETE /recipe-components/8001 as a project guest — 403 error, the link is not removed
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | guest    | active |
    And the recipe_components table contains:
      | id   | parent_recipe_id | component_recipe_id | multiplier | position | status |
      | 8001 | 6001               | 6002                  | 2.00        | 0        | active |
    When I DELETE /api/features/tasks/recipe-components/8001
    Then the response status code is 403
    And the recipe_components table contains:
      | id   | parent_recipe_id | component_recipe_id | multiplier | position | status |
      | 8001 | 6001               | 6002                  | 2.00        | 0        | active |
