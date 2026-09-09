Feature: Export the meals plan as a PDF
  As a project member
  I want to export the planned meals for a date range as a PDF
  So that I can print the plan and its recipes and take them away from a screen

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

  Scenario: GET the PDF for a week with planned meals and a linked recipe — a valid PDF is returned
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the recipes table contains:
      | id   | feature_instance_id | name    | servings | difficulty | prep_time_minutes | total_time_minutes | status |
      | 6001 | 0040                | Lasagna | 4        | 2          | 20                | 60                  | active |
    And the recipe_ingredients table contains:
      | id   | recipe_id | groceries_item_id | custom_name    | custom_unit | quantity | status |
      | 9001 | 6001      |                    | Lasagna sheets | packs       | 1.0       | active |
    And the meals table contains:
      | id   | feature_instance_id | title         | start_at             | end_at               | headcount | status |
      | 7001 | 0041                | Family dinner | 2026-09-07T19:00:00Z | 2026-09-07T20:30:00Z | 8         | active |
      | 7002 | 0041                | Past brunch   | 2026-08-20T10:00:00Z | 2026-08-20T11:00:00Z | 4         | active |
    And the meal_recipes table contains:
      | meal_id | recipe_id |
      | 7001    | 6001      |
    When I GET /api/features/tasks/meals/pdf/0041?start_date=2026-09-07&end_date=2026-09-13
    Then the response status code is 200
    And the response content type is "application/pdf"
    And the response body is a valid PDF

  Scenario: GET the PDF for a range with no planned meals — still a valid PDF, with just the empty table page
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I GET /api/features/tasks/meals/pdf/0041?start_date=2026-09-07&end_date=2026-09-13
    Then the response status code is 200
    And the response content type is "application/pdf"
    And the response body is a valid PDF

  @error_case
  Scenario: GET the PDF without project access — 403
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tasks/meals/pdf/0041?start_date=2026-09-07&end_date=2026-09-13
    Then the response status code is 403
