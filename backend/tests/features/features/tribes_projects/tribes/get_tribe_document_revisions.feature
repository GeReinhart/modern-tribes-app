Feature: Get a tribe's description revision history
  As a tribe member
  I want to see previous versions of a tribe's description
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

  Scenario: GET revisions for a tribe with no description document — empty history
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I GET /api/features/tribes-projects/tribes/0010/document/revisions
    Then the response status code is 200
    And the response body includes:
      """
      []
      """

  Scenario: GET revisions for a tribe whose description was updated — the previous version is kept, current first
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | manager  | active |
    And the documents table contains:
      | id   | content_html      | status |
      | 0500 | <p>Old text.</p>  | active |
    And the tribes table contains:
      | id   | name | document_id | status |
      | 0010 | Home | 0500        | active |
    When I PUT /api/features/tribes-projects/tribes/0010/with-positions with body:
      """
      { "document_content_html": "<p>New text.</p>" }
      """
    And I GET /api/features/tribes-projects/tribes/0010/document/revisions
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"content_html": "<p>New text.</p>", "is_current": true},
        {"content_html": "<p>Old text.</p>", "is_current": false}
      ]
      """

  @error_case
  Scenario: GET revisions for a tribe the user has no position in — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tribes-projects/tribes/0010/document/revisions
    Then the response status code is 403

  @error_case
  Scenario: GET revisions for an unknown tribe — 404 error
    Given I am authenticated as an administrator: user.id 0001
    When I GET /api/features/tribes-projects/tribes/9999/document/revisions
    Then the response status code is 404
