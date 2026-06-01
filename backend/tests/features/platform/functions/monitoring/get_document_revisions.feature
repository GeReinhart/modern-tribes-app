@wip
Feature: Get document revisions
  As an administrator
  I want to retrieve the revision history of a document
  So that I can audit changes made over time

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

  Scenario: GET /monitoring/documents/0010/revisions as admin — revisions are returned
    Given I am authenticated as an administrator: user.id 0001
    And the documents table contains:
      | id   | content_html   | status |
      | 0010 | <p>Content</p> | active |
    When I GET /api/platform/functions/monitoring/documents/0010/revisions
    Then the response status code is 200

  @error_case
  Scenario: GET /monitoring/documents/0010/revisions as a viewer — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/platform/functions/monitoring/documents/0010/revisions
    Then the response status code is 403
