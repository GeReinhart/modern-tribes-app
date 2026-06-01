@wip
Feature: List projects
  As an administrator
  I want to list all projects
  So that I can manage them in the system

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

  Scenario: GET /projects/ as admin — projects are returned
    Given I am authenticated as an administrator: user.id 0001
    When I GET /api/features/tribes-projects/projects/
    Then the response status code is 200

  @error_case
  Scenario: GET /projects/ as a viewer — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tribes-projects/projects/
    Then the response status code is 403
