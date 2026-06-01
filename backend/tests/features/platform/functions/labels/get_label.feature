@wip
Feature: Get a label
  As an administrator
  I want to retrieve a label by its ID
  So that I can view its details

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

  Scenario: GET /labels/0010 as admin — label is returned
    Given I am authenticated as an administrator: user.id 0001
    And the labels table contains:
      | id   | name   | status |
      | 0010 | Urgent | active |
    When I GET /api/platform/functions/labels/0010
    Then the response status code is 200

  @error_case
  Scenario: GET /labels/0010 as a viewer — 403 error
    Given I am authenticated as a regular user: user.id 0002
    And the labels table contains:
      | id   | name   | status |
      | 0010 | Urgent | active |
    When I GET /api/platform/functions/labels/0010
    Then the response status code is 403
