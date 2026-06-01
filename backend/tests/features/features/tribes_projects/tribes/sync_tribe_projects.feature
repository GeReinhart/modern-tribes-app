@wip
Feature: Sync tribe projects
  As an administrator
  I want to sync the projects linked to a tribe
  So that the tribe's project list stays up to date

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

  Scenario: PUT /tribes/0010/projects as admin — projects are synced
    Given I am authenticated as an administrator: user.id 0001
    And the tribes table contains:
      | id   | name        | status |
      | 0010 | Engineering | active |
    When I PUT /api/features/tribes-projects/tribes/0010/projects with body:
      """
      []
      """
    Then the response status code is 200

  @error_case
  Scenario: PUT /tribes/0010/projects as a viewer — 403 error
    Given I am authenticated as a regular user: user.id 0002
    And the tribes table contains:
      | id   | name        | status |
      | 0010 | Engineering | active |
    When I PUT /api/features/tribes-projects/tribes/0010/projects with body:
      """
      []
      """
    Then the response status code is 403
