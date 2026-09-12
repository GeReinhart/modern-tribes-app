Feature: Get a project document page's content revision history
  As a project member
  I want to see previous versions of a document page's content
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
    And the documents table contains:
      | id   | content_html | status |
      | 0200 | <p>doc</p>   | active |
    And the projects_documents table contains:
      | id   | project_id | document_id | title | status |
      | 0300 | 0100       | 0200        | Notes | active |
    And the document_pages table contains:
      | id   | project_document_id | title  | content_html      | status |
      | 0400 | 0300                 | Page 1 | <p>Original.</p>  | active |

  Scenario: GET revisions for a page that has never been edited since creation — just the current entry
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I GET /api/platform/functions/documents/projects/0100/documents/0300/pages/0400/revisions
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"content_html": "<p>Original.</p>", "is_current": true}
      ]
      """

  Scenario: GET revisions for a page whose content was updated via PUT — the previous version is kept, current first
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I PUT /api/platform/functions/documents/projects/0100/documents/0300/pages/0400 with body:
      """
      { "content_html": "<p>Updated.</p>" }
      """
    And I GET /api/platform/functions/documents/projects/0100/documents/0300/pages/0400/revisions
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"content_html": "<p>Updated.</p>", "is_current": true},
        {"content_html": "<p>Original.</p>", "is_current": false}
      ]
      """

  @error_case
  Scenario: GET revisions for a page without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/platform/functions/documents/projects/0100/documents/0300/pages/0400/revisions
    Then the response status code is 403

  @error_case
  Scenario: GET revisions for a page not belonging to the given project document — 404 error
    Given I am authenticated as an administrator: user.id 0001
    And the documents table contains:
      | id   | content_html  | status |
      | 0201 | <p>other</p>  | active |
    And the projects_documents table contains:
      | id   | project_id | document_id | title | status |
      | 0301 | 0100       | 0201        | Other | active |
    And the document_pages table contains:
      | id   | project_document_id | title  | content_html | status |
      | 0401 | 0301                 | Orphan | <p>x</p>     | active |
    When I GET /api/platform/functions/documents/projects/0100/documents/0300/pages/0401/revisions
    Then the response status code is 404
