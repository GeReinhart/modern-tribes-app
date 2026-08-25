@wip
Feature: List recipes across a project
  As a project member
  I want to see recipes from every Recipes tab of a project
  So that other features (e.g. meals) can pick from any of the project's recipe books

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
      | id   | project_id | name       | feature_type | status |
      | 0040 | 0100       | Recipes    | recipes      | active |
      | 0041 | 0100       | Party menu | recipes      | active |
    And the recipes table contains:
      | id   | feature_instance_id | name     | servings | status |
      | 6001 | 0040                | Lasagna  | 4        | active |
      | 6002 | 0041                | Tiramisu | 6        | active |

  Scenario: GET /recipes/by-project/0100 as a project member — recipes from every Recipes tab are returned
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I GET /api/features/tasks/recipes/by-project/0100
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"id": "6001", "name": "Lasagna"},
        {"id": "6002", "name": "Tiramisu"}
      ]
      """

  @error_case
  Scenario: GET /recipes/by-project/0100 without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tasks/recipes/by-project/0100
    Then the response status code is 403
