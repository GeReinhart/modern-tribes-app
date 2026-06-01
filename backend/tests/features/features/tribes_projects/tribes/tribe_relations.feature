@wip
Feature: Get tribe relations
  As an administrator
  I want to retrieve the positions, projects, and persons linked to a tribe
  So that I can understand its composition

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

  Scenario: GET /tribes/0010/positions as admin — positions are returned
    Given I am authenticated as an administrator: user.id 0001
    And the tribes table contains:
      | id   | name        | status |
      | 0010 | Engineering | active |
    When I GET /api/features/tribes-projects/tribes/0010/positions
    Then the response status code is 200

  Scenario: GET /tribes/0010/projects as admin — projects are returned
    Given I am authenticated as an administrator: user.id 0001
    And the tribes table contains:
      | id   | name        | status |
      | 0010 | Engineering | active |
    When I GET /api/features/tribes-projects/tribes/0010/projects
    Then the response status code is 200

  Scenario: GET /tribes/0010/persons as admin — persons are returned
    Given I am authenticated as an administrator: user.id 0001
    And the tribes table contains:
      | id   | name        | status |
      | 0010 | Engineering | active |
    When I GET /api/features/tribes-projects/tribes/0010/persons
    Then the response status code is 200

  @error_case
  Scenario: GET /tribes/0010/positions as a viewer — 403 error
    Given I am authenticated as a regular user: user.id 0002
    And the tribes table contains:
      | id   | name        | status |
      | 0010 | Engineering | active |
    When I GET /api/features/tribes-projects/tribes/0010/positions
    Then the response status code is 403
