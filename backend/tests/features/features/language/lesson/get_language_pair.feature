@wip
Feature: Get a project's language pair
  As a project member
  I want to see which language pair this project's lessons are about
  So that the lesson, learn and test tabs know whether a pair still needs to be set

  Background:
    Given the users table contains:
      | id   | email         | status |
      | 0002 | user@test.com | active |
    And the roles table contains:
      | name   | status |
      | viewer | active |
    And the role_permissions table contains:
      | role   | permission                 |
      | viewer | can_access_attached_tribes |
    And the user_roles table contains:
      | user          | role   |
      | user@test.com | viewer |
    And the persons table contains:
      | id   | first_name | last_name | status |
      | 0030 | Mia        | Member    | active |
    And the users table contains:
      | id   | email         | person_id | status |
      | 0002 | user@test.com | 0030      | active |
    And the languages table contains:
      | code | name    | status |
      | fr   | French  | active |
      | en   | English | active |
    And the tribes table contains:
      | id   | name | status |
      | 0010 | Band | active |
    And the projects table contains:
      | id   | name       | status |
      | 0020 | Vocabulary | active |
    And the tribes_projects table contains:
      | tribe_id | project_id | relation |
      | 0010     | 0020       | manager  |

  Scenario: GET the language pair of a project that has one set — it is returned
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the language_settings table contains:
      | project_id | source_language | target_language | status |
      | 0020       | fr               | en               | active |
    When I GET /api/features/tasks/language/projects/0020/settings
    Then the response status code is 200
    And the response body is:
      """
      { "project_id": "0020", "source_language": "fr", "target_language": "en" }
      """

  Scenario: GET the language pair of a project that has none set yet — 404
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the language_settings table contains:
      | project_id | source_language | target_language | status |
    When I GET /api/features/tasks/language/projects/0020/settings
    Then the response status code is 404

  @error_case
  Scenario: GET the language pair as a user without access to the project's tribe — 403
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id | tribe_id | person_id | position | status |
    When I GET /api/features/tasks/language/projects/0020/settings
    Then the response status code is 403
