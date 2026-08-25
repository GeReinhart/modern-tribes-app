@wip
Feature: Create a recipe
  As a project member
  I want to create a recipe with its base serving count
  So that I can plan meals and shopping around it

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
    And the tribes table contains:
      | id   | name    | status |
      | 0010 | DevTeam | active |
    And the projects table contains:
      | id   | name  | status |
      | 0020 | Alpha | active |
    And the tribes_projects table contains:
      | tribe_id | project_id |
      | 0010     | 0020       |
    And the persons table contains:
      | id   | first_name | last_name | status |
      | 0030 | Alice      | Smith     | active |
    And the positions table contains:
      | tribe_id | person_id | position |
      | 0010     | 0030      | member   |
    And the projects_features table contains:
      | id   | project_id | feature_type | name    | position | status |
      | 0040 | 0020       | recipes      | Recipes | 0        | active |

  Scenario: POST /recipes with valid body as admin — the recipe is created
    Given I am authenticated as an administrator: user.id 0001
    And the recipes table contains:
      | id | feature_instance_id | name | servings | status |
    When I POST /api/features/tasks/recipes/ with body:
      """
      {
        "feature_instance_id": "0040",
        "name": "Lasagna",
        "servings": 4
      }
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "name": "Lasagna",
        "servings": 4
      }
      """
    And the recipes table contains:
      | name    | servings | status |
      | Lasagna | 4        | active |

  Scenario: POST /recipes with a description — the note is saved and linked
    Given I am authenticated as an administrator: user.id 0001
    And the recipes table contains:
      | id | feature_instance_id | name | servings | status |
    And the documents table contains:
      | id | content_html | content_text |
    When I POST /api/features/tasks/recipes/ with body:
      """
      {
        "feature_instance_id": "0040",
        "name": "Lasagna",
        "servings": 4,
        "document_content_html": "<p>Layer pasta, sauce and bechamel</p>"
      }
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "name": "Lasagna",
        "document_content_html": "<p>Layer pasta, sauce and bechamel</p>"
      }
      """
    And the recipes table contains:
      | name    | servings | status |
      | Lasagna | 4        | active |
    And the documents table contains:
      | content_html                            |
      | <p>Layer pasta, sauce and bechamel</p>  |

  @error_case
  Scenario: POST /recipes with a missing servings count — 422 error and the database is not modified
    Given I am authenticated as an administrator: user.id 0001
    And the recipes table contains:
      | id | feature_instance_id | name | servings | status |
    When I POST /api/features/tasks/recipes/ with body:
      """
      {
        "feature_instance_id": "0040",
        "name": "Lasagna"
      }
      """
    Then the response status code is 422
    And the recipes table contains:
      | id | feature_instance_id | name | servings | status |

  @error_case
  Scenario: POST /recipes as a user with no app access — 403 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the recipes table contains:
      | id | feature_instance_id | name | servings | status |
    When I POST /api/features/tasks/recipes/ with body:
      """
      {
        "feature_instance_id": "0040",
        "name": "Hidden recipe",
        "servings": 2
      }
      """
    Then the response status code is 403
    And the recipes table contains:
      | id | feature_instance_id | name | servings | status |
