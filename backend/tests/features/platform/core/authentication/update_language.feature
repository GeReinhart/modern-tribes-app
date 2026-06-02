@wip
Feature: Update user language preference
  As an authenticated user
  I want to update my language preference
  So that the interface is displayed in my chosen language

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

  Scenario: PATCH /authentication/me/language as admin — language is updated
    Given I am authenticated as an administrator: user.id 0001
    When I PATCH /api/platform/core/authentication/me/language with body:
      """
      {"language": "fr"}
      """
    Then the response status code is 200
    And the users table contains:
      | id   | language | status |
      | 0001 | fr       | active |
      | 0002 | en       | active |

  Scenario: PATCH /authentication/me/language as a regular user — language is updated
    Given I am authenticated as a regular user: user.id 0002
    When I PATCH /api/platform/core/authentication/me/language with body:
      """
      {"language": "fr"}
      """
    Then the response status code is 200
    And the users table contains:
      | id   | language | status |
      | 0001 | en       | active |
      | 0002 | fr       | active |
