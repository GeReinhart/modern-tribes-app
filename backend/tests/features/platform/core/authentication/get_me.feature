@wip
Feature: Get current user profile
  As an authenticated user
  I want to retrieve my own profile
  So that I can see my account information

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

  Scenario: GET /authentication/me as admin — profile is returned
    Given I am authenticated as an administrator: user.id 0001
    When I GET /api/platform/core/authentication/me
    Then the response status code is 200

  Scenario: GET /authentication/me as a regular user — profile is returned
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/platform/core/authentication/me
    Then the response status code is 200
