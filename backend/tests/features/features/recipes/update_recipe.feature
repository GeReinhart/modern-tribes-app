@wip
Feature: Update a recipe
  As a project member
  I want to change a recipe's fields and its draft/completed state
  So that the recipe book stays accurate and reflects what's still being worked on

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

  Scenario: PATCH /recipes/6001 with a new name and servings — the recipe is updated
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the recipes table contains:
      | id   | feature_instance_id | name    | servings | status |
      | 6001 | 0040                | Lasagna | 4        | active |
    When I PATCH /api/features/tasks/recipes/6001 with body:
      """
      {"name": "Beef lasagna", "servings": 6}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "id": "6001",
        "name": "Beef lasagna",
        "servings": 6,
        "recipe_state": "draft"
      }
      """
    And the recipes table contains:
      | id   | feature_instance_id | name         | servings | status |
      | 6001 | 0040                | Beef lasagna | 6        | active |

  Scenario: PATCH /recipes/6001 setting recipe_state to completed — the recipe is marked completed
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the recipes table contains:
      | id   | feature_instance_id | name    | servings | status | recipe_state |
      | 6001 | 0040                | Lasagna | 4        | active | draft        |
    When I PATCH /api/features/tasks/recipes/6001 with body:
      """
      {"recipe_state": "completed"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "id": "6001",
        "recipe_state": "completed"
      }
      """
    And the recipes table contains:
      | id   | feature_instance_id | name    | status | recipe_state |
      | 6001 | 0040                | Lasagna | active | completed    |

  Scenario: PATCH /recipes/6001 setting recipe_state back to draft — the recipe is marked as a draft again
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the recipes table contains:
      | id   | feature_instance_id | name    | servings | status | recipe_state |
      | 6001 | 0040                | Lasagna | 4        | active | completed    |
    When I PATCH /api/features/tasks/recipes/6001 with body:
      """
      {"recipe_state": "draft"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "id": "6001",
        "recipe_state": "draft"
      }
      """
    And the recipes table contains:
      | id   | feature_instance_id | name    | status | recipe_state |
      | 6001 | 0040                | Lasagna | active | draft        |

  @error_case
  Scenario: PATCH /recipes/6001 as a project guest — 403 error and the recipe is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | guest    | active |
    And the recipes table contains:
      | id   | feature_instance_id | name    | servings | status | recipe_state |
      | 6001 | 0040                | Lasagna | 4        | active | draft        |
    When I PATCH /api/features/tasks/recipes/6001 with body:
      """
      {"name": "Beef lasagna"}
      """
    Then the response status code is 403
    And the recipes table contains:
      | id   | feature_instance_id | name    | servings | status | recipe_state |
      | 6001 | 0040                | Lasagna | 4        | active | draft        |
