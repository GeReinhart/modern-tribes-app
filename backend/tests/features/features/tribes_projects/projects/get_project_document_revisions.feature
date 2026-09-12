Feature: Get a project's description revision history
  As a project member
  I want to see previous versions of a project's description
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
    And the projects table contains:
      | id   | name   | status |
      | 0010 | Hermes | active |

  Scenario: GET revisions for a project with no description document — empty history
    Given I am authenticated as a regular user: user.id 0002
    And the user_roles table contains:
      | user          | role   |
      | user@test.com | viewer |
    When I GET /api/features/tribes-projects/projects/0010/document/revisions
    Then the response status code is 200
    And the response body includes:
      """
      []
      """

  Scenario: GET revisions for a project whose description was updated — the previous version is kept, current first
    Given I am authenticated as a regular user: user.id 0002
    And the user_roles table contains:
      | user          | role   |
      | user@test.com | viewer |
    And the documents table contains:
      | id   | content_html      | status |
      | 0500 | <p>Old text.</p>  | active |
    And the projects table contains:
      | id   | name   | document_id | status |
      | 0010 | Hermes | 0500        | active |
    When I PUT /api/features/tribes-projects/projects/0010/with-document with body:
      """
      { "document_content_html": "<p>New text.</p>" }
      """
    And I GET /api/features/tribes-projects/projects/0010/document/revisions
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"content_html": "<p>New text.</p>", "is_current": true},
        {"content_html": "<p>Old text.</p>", "is_current": false}
      ]
      """

  @error_case
  Scenario: GET revisions as a user with no admin/tribe-access permission — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tribes-projects/projects/0010/document/revisions
    Then the response status code is 403

  @error_case
  Scenario: GET revisions for an unknown project — 404 error
    Given I am authenticated as an administrator: user.id 0001
    When I GET /api/features/tribes-projects/projects/9999/document/revisions
    Then the response status code is 404
