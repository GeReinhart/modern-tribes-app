@wip
Feature: Archive a document
  As an administrator
  I want to archive a document
  So that it is no longer active in the system

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

  Scenario: DELETE /documents/0010 as admin — document is archived
    Given I am authenticated as an administrator: user.id 0001
    And the documents table contains:
      | id   | content_html   | status |
      | 0010 | <p>Content</p> | active |
    When I DELETE /api/platform/functions/documents/0010
    Then the response status code is 204
    And the documents table contains:
      | id   | content_html   | status   |

  @error_case
  Scenario: DELETE /documents/0010 as a viewer — 403 error and the document is not archived
    Given I am authenticated as a regular user: user.id 0002
    And the documents table contains:
      | id   | content_html   | status |
      | 0010 | <p>Content</p> | active |
    When I DELETE /api/platform/functions/documents/0010
    Then the response status code is 403
    And the documents table contains:
      | id   | content_html   | status |
      | 0010 | <p>Content</p> | active |
