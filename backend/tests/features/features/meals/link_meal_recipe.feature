@wip
Feature: Link a recipe to a meal
  As a project member
  I want to attach one or more recipes to a meal
  So that the meal's shopping needs can be worked out from those recipes

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
      | 0041 | 0100       | Meals   | meals        | active |
    And the recipes table contains:
      | id   | feature_instance_id | name    | servings | status |
      | 6001 | 0040                | Lasagna | 4        | active |
    And the meals table contains:
      | id   | feature_instance_id | title         | start_at             | end_at               | headcount | status |
      | 7001 | 0041                | Family dinner | 2026-09-05T19:00:00Z | 2026-09-05T20:30:00Z | 8         | active |

  Scenario: POST /meals/7001/recipes/6001 as a project member — the recipe is linked
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the meal_recipes table contains:
      | meal_id | recipe_id |
    When I POST /api/features/tasks/meals/7001/recipes/6001
    Then the response status code is 200
    And the response body is:
      """
      ["6001"]
      """
    And the meal_recipes table contains:
      | meal_id | recipe_id |
      | 7001    | 6001      |

  Scenario: POST /meals/7001/recipes/6001 again — the recipe is unlinked
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the meal_recipes table contains:
      | meal_id | recipe_id |
      | 7001    | 6001      |
    When I POST /api/features/tasks/meals/7001/recipes/6001
    Then the response status code is 200
    And the response body is:
      """
      []
      """
    And the meal_recipes table contains:
      | meal_id | recipe_id |

  @error_case
  Scenario: POST /meals/7001/recipes/6001 as a project guest — 403 error and the link is not created
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | guest    | active |
    And the meal_recipes table contains:
      | meal_id | recipe_id |
    When I POST /api/features/tasks/meals/7001/recipes/6001
    Then the response status code is 403
    And the meal_recipes table contains:
      | meal_id | recipe_id |
