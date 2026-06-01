@wip
Feature: Update a document
  As an administrator
  I want to update a document's content
  So that the information stays current

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

  Scenario: PUT /documents/0010 with valid body as admin — the document is updated
    Given I am authenticated as an administrator: user.id 0001
    And the documents table contains:
      | id   | content_html     | status |
      | 0010 | <p>Old content</p> | active |
    When I PUT /api/platform/functions/documents/0010 with body:
      """
      {"content_html": "<p>New content</p>"}
      """
    Then the response status code is 200
    And the documents table contains:
      | id   | content_html     | status |
      | 0010 | <p>New content</p> | active |

  @error_case
  Scenario: PUT /documents/0010 as a viewer — 403 error and the document is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the documents table contains:
      | id   | content_html     | status |
      | 0010 | <p>Old content</p> | active |
    When I PUT /api/platform/functions/documents/0010 with body:
      """
      {"content_html": "<p>New content</p>"}
      """
    Then the response status code is 403
    And the documents table contains:
      | id   | content_html     | status |
      | 0010 | <p>Old content</p> | active |
