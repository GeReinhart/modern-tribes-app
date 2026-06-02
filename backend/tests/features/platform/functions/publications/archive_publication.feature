@wip
Feature: Archive a publication
  As an administrator
  I want to archive a publication
  So that it is no longer visible on the platform

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
    And the projects table contains:
      | id   | name    | status |
      | 0100 | Project | active |
    And the documents table contains:
      | id   | content_html   | status |
      | 0010 | <p>Content</p> | active |
    And the projects_documents table contains:
      | id   | project_id | document_id | title  | status |
      | 0010 | 0100       | 0010        | My Doc | active |

  Scenario: DELETE /publications/0010 as admin — publication is archived
    Given I am authenticated as an administrator: user.id 0001
    And the publications table contains:
      | id   | document_id | project_document_id | status |
      | 0010 | 0010        | 0010                | active |
    When I DELETE /api/platform/functions/publications/0010
    Then the response status code is 204
    And the publications table contains:
      | id | document_id | project_document_id | status |

  @error_case
  Scenario: DELETE /publications/0010 as a viewer — 403 error
    Given I am authenticated as a regular user: user.id 0002
    And the publications table contains:
      | id   | document_id | project_document_id | status |
      | 0010 | 0010        | 0010                | active |
    When I DELETE /api/platform/functions/publications/0010
    Then the response status code is 403
    And the publications table contains:
      | id   | document_id | project_document_id | status |
      | 0010 | 0010        | 0010                | active |
