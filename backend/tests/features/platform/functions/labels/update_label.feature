Feature: Update a label
  As an administrator
  I want to update a label's name
  So that labels stay accurately named

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

  Scenario: PUT /labels/0010 with valid body as admin — the label is updated
    Given I am authenticated as an administrator: user.id 0001
    And the labels table contains:
      | id   | name   | status |
      | 0010 | Urgent | active |
    When I PUT /api/platform/functions/labels/0010 with body:
      """
      {"name": "Critical"}
      """
    Then the response status code is 200
    And the labels table contains:
      | id   | name     | status |
      | 0010 | Critical | active |

  @error_case
  Scenario: PUT /labels/0010 as a viewer — 403 error and the label is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the labels table contains:
      | id   | name   | status |
      | 0010 | Urgent | active |
    When I PUT /api/platform/functions/labels/0010 with body:
      """
      {"name": "Critical"}
      """
    Then the response status code is 403
    And the labels table contains:
      | id   | name   | status |
      | 0010 | Urgent | active |
