@wip
Feature: Configure the theme associated with a language
  As an admin or a member of a project (anyone with access to attached tribes)
  I want to assign a theme to each language
  So that every word of that language is shown with the same color everywhere

  Background:
    Given the users table contains:
      | id   | email          | status |
      | 0001 | admin@test.com | active |
      | 0002 | user@test.com  | active |
      | 0003 | other@test.com | active |
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
    And the languages table contains:
      | code | name    | theme_code | status |
      | fr   | French  |            | active |
      | en   | English | ocean      | active |

  Scenario: GET the language list — each language's configured theme is included
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tasks/language/languages
    Then the response status code is 200
    And the response body includes:
      """
      [
        { "code": "en", "name": "English", "theme_code": "ocean" },
        { "code": "fr", "name": "French", "theme_code": null }
      ]
      """

  Scenario: PATCH a language's theme as an admin — it is updated
    Given I am authenticated as an administrator: user.id 0001
    When I PATCH /api/features/tasks/language/languages/fr with body:
      """
      { "theme_code": "forest" }
      """
    Then the response status code is 200
    And the response body includes:
      """
      { "code": "fr", "name": "French", "theme_code": "forest" }
      """
    And the languages table contains:
      | code | name    | theme_code | status |
      | en   | English | ocean      | active |
      | fr   | French  | forest     | active |

  Scenario: PATCH a language's theme as a regular member — it is updated too, the theme being shared by every project
    Given I am authenticated as a regular user: user.id 0002
    When I PATCH /api/features/tasks/language/languages/fr with body:
      """
      { "theme_code": "forest" }
      """
    Then the response status code is 200
    And the response body includes:
      """
      { "code": "fr", "name": "French", "theme_code": "forest" }
      """
    And the languages table contains:
      | code | name    | theme_code | status |
      | en   | English | ocean      | active |
      | fr   | French  | forest     | active |

  @error_case
  Scenario: PATCH a language's theme as a user without any access to the projects' tribes — 403 and nothing changes
    Given I am authenticated as a regular user: user.id 0003
    When I PATCH /api/features/tasks/language/languages/fr with body:
      """
      { "theme_code": "forest" }
      """
    Then the response status code is 403
    And the languages table contains:
      | code | name    | theme_code | status |
      | en   | English | ocean      | active |
      | fr   | French  |            | active |
