@wip
Feature: Compare the members' scores on a lesson
  As a project member
  I want the overall score history of every member of the project
  So that the results page can chart them together as a friendly competition

  Only the members who answered at least once appear, each with the same daily history as in
  the score history (one point per day from their first answer until today).

  Background:
    Given today is 2026-11-16
    And the users table contains:
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
    And the language_settings table contains:
      | project_id | source_language | target_language | status |
      | 0020       | fr               | en               | active |
    And the documents table contains:
      | id   | status |
      | 0500 | active |
    And the language_lessons table contains:
      | id   | project_id | title                 | document_id | status |
      | 1500 | 0020       | Chapter 1 - Greetings | 0500        | active |

  Scenario: GET the competition — every member who answered has their own history, members who never answered are left out
    Given I am authenticated as a regular user: user.id 0002
    And the persons table contains:
      | id   | first_name | last_name | status |
      | 0031 | Leo        | Learner   | active |
      | 0032 | Ann        | Absent    | active |
    And the users table contains:
      | id   | email         | person_id | status |
      | 0003 | leo@test.com  | 0031      | active |
      | 0004 | ann@test.com  | 0032      | active |
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
      | 1002 | 0010     | 0031      | member   | active |
      | 1003 | 0010     | 0032      | member   | active |
    And the language_words table contains:
      | id   | text  | language | word_type | status |
      | 2001 | chat  | fr       | noun      | active |
      | 2002 | cat   | en       | noun      | active |
    And the language_word_translations table contains:
      | id   | word_id_a | word_id_b | status |
      | 4001 | 2001      | 2002      | active |
    And the language_lesson_words table contains:
      | lesson_id | word_id | status |
      | 1500      | 2001    | active |
    And the language_word_test_attempts table contains:
      | id   | user_id | word_id | direction        | mode | correct | created_at          | status |
      | 7001 | 0003    | 2001    | source_to_target | free | true    | 2026-11-15T10:00:00 | active |
      | 7002 | 0002    | 2001    | source_to_target | free | true    | 2026-11-16T10:00:00 | active |
    When I GET /api/features/tasks/language/lessons/1500/result/competition
    Then the response status code is 200
    And the response body includes:
      """
      {
        "members": [
          {
            "user_id": "0003",
            "name": "Leo Learner",
            "points": [
              { "date": "2026-11-15", "score": 0.1667 },
              { "date": "2026-11-16", "score": 0.1667 }
            ]
          },
          {
            "user_id": "0002",
            "name": "Mia Member",
            "points": [ { "date": "2026-11-16", "score": 0.1667 } ]
          }
        ]
      }
      """

  @error_case
  Scenario: GET the competition as a user without access to the project's tribe — 403
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id | tribe_id | person_id | position | status |
    When I GET /api/features/tasks/language/lessons/1500/result/competition
    Then the response status code is 403
