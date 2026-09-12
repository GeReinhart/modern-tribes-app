Feature: Get a recipe's description revision history
  As a project member
  I want to see previous versions of a recipe's description
  So that I can recover an earlier version if a change turns out to be wrong

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
      | id   | feature_instance_id | name    | servings | status |
      | 6001 | 0040                 | Lasagna | 4        | active |

  Scenario: GET revisions for a recipe whose description was never saved — empty history
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I GET /api/features/tasks/recipes/6001/document/revisions
    Then the response status code is 200
    And the response body includes:
      """
      []
      """

  Scenario: GET revisions for a recipe whose description was updated — the previous version is kept, current first
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the documents table contains:
      | id   | content_html      | status |
      | 0500 | <p>Old text.</p>  | active |
    And the recipes table contains:
      | id   | feature_instance_id | name    | servings | document_id | status |
      | 6001 | 0040                 | Lasagna | 4        | 0500        | active |
    When I PATCH /api/features/tasks/recipes/6001 with body:
      """
      { "document_content_html": "<p>New text.</p>" }
      """
    And I GET /api/features/tasks/recipes/6001/document/revisions
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"content_html": "<p>New text.</p>", "is_current": true},
        {"content_html": "<p>Old text.</p>", "is_current": false}
      ]
      """

  @error_case
  Scenario: GET revisions for a recipe without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tasks/recipes/6001/document/revisions
    Then the response status code is 403

  @error_case
  Scenario: GET revisions for an unknown recipe — 404 error
    Given I am authenticated as an administrator: user.id 0001
    When I GET /api/features/tasks/recipes/9999/document/revisions
    Then the response status code is 404
