@wip
Feature: List meals already added to a groceries list
  As a project member in shopping mode
  I want to see which meals this list already accounts for
  So that I know why an item is on the list and for how many people

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
    And the groceries_lists table contains:
      | id   | feature_instance_id | scheduled_date | list_status | status |
      | 8001 | 0042                | 2026-09-01      | planned     | active |
    And the recipes table contains:
      | id   | feature_instance_id | name     | servings | status |
      | 6001 | 0040                | Lasagna  | 4        | active |
      | 6002 | 0040                | Tiramisu | 6        | active |
    And the meals table contains:
      | id   | feature_instance_id | title         | start_at             | end_at               | headcount | status |
      | 7001 | 0041                | Family dinner | 2026-09-05T19:00:00Z | 2026-09-05T20:30:00Z | 8         | active |
      | 7002 | 0041                | Brunch        | 2026-09-06T10:00:00Z | 2026-09-06T11:00:00Z | 3         | active |
    And the meal_recipes table contains:
      | meal_id | recipe_id |
      | 7001    | 6001      |
      | 7001    | 6002      |

  Scenario: GET /meals/added-to-groceries-list/8001 as a project member — added meals are listed with their date, headcount and recipes
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the groceries_list_meals table contains:
      | id   | groceries_list_id | meal_id | headcount | status |
      | 5001 | 8001               | 7001    | 8         | active |
      | 5002 | 8001               | 7002    | 3         | active |
    When I GET /api/features/tasks/meals/added-to-groceries-list/8001
    Then the response status code is 200
    And the response body is:
      """
      [
        {
          "meal_id": "7001",
          "meal_title": "Family dinner",
          "meal_start_at": "2026-09-05T19:00:00Z",
          "headcount": 8,
          "recipe_names": ["Lasagna", "Tiramisu"]
        },
        {
          "meal_id": "7002",
          "meal_title": "Brunch",
          "meal_start_at": "2026-09-06T10:00:00Z",
          "headcount": 3,
          "recipe_names": []
        }
      ]
      """

  Scenario: GET /meals/added-to-groceries-list/8001 — no meals added yet, an empty list is returned
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I GET /api/features/tasks/meals/added-to-groceries-list/8001
    Then the response status code is 200
    And the response body is:
      """
      []
      """

  @error_case
  Scenario: GET /meals/added-to-groceries-list/8001 without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tasks/meals/added-to-groceries-list/8001
    Then the response status code is 403
