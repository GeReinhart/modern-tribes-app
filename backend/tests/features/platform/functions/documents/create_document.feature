Feature: Create a document
  As an administrator
  I want to create a document
  So that it can be associated with entities in the platform

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

  Scenario: POST /documents/ with valid body as admin — the document is created
    Given I am authenticated as an administrator: user.id 0001
    And the documents table contains:
      | id | content_html | status |
    When I POST /api/platform/functions/documents/ with body:
      """
      {"content_html": "<p>Hello world</p>"}
      """
    Then the response status code is 201
    And the documents table contains:
      | content_html      | status |
      | <p>Hello world</p> | active |

  Scenario: POST /documents/ with missing content_html — 422 error and the database is not modified
    Given I am authenticated as an administrator: user.id 0001
    And the documents table contains:
      | id | content_html | status |
    When I POST /api/platform/functions/documents/ with body:
      """
      {}
      """
    Then the response status code is 422
    And the documents table contains:
      | id | content_html | status |

  @error_case
  Scenario: POST /documents/ as a viewer — 403 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the documents table contains:
      | id | content_html | status |
    When I POST /api/platform/functions/documents/ with body:
      """
      {"content_html": "<p>Hello world</p>"}
      """
    Then the response status code is 403
    And the documents table contains:
      | id | content_html | status |
