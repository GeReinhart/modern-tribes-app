@wip
Feature: See how a lesson's score evolves over time
  As a project member
  I want the lesson's overall score day by day
  So that the results page can chart how well the lesson is known over time

  The history has one point per day, from the day of the first answer until today. Each point is
  the lesson's overall score as it was at the end of that day: the average of its words' scores
  computed from the answers given up to then (the lesson's current words, with the usual decay
  for untested weeks). Picking another project member shows that member's history.

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

  Scenario: GET the score history — one point per day from the first answer until today, each computed from the answers given up to that day
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
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
      | id   | word_id | direction        | mode | correct | created_at          | status |
      | 7001 | 2001    | source_to_target | free | true    | 2026-11-14T10:00:00 | active |
      | 7002 | 2001    | source_to_target | free | true    | 2026-11-15T10:00:00 | active |
      | 7003 | 2001    | target_to_source | free | true    | 2026-11-15T11:00:00 | active |
    When I GET /api/features/tasks/language/lessons/1500/result/score/history
    Then the response status code is 200
    And the response body includes:
      """
      {
        "points": [
          { "date": "2026-11-14", "score": 0.1667 },
          { "date": "2026-11-15", "score": 0.5 },
          { "date": "2026-11-16", "score": 0.5 }
        ]
      }
      """

  Scenario: GET the score history of a lesson with an untested word — the day's score is the average over all the lesson's words
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the language_words table contains:
      | id   | text  | language | word_type | status |
      | 2001 | chat  | fr       | noun      | active |
      | 2002 | cat   | en       | noun      | active |
      | 2003 | chien | fr       | noun      | active |
      | 2004 | dog   | en       | noun      | active |
    And the language_word_translations table contains:
      | id   | word_id_a | word_id_b | status |
      | 4001 | 2001      | 2002      | active |
      | 4002 | 2003      | 2004      | active |
    And the language_lesson_words table contains:
      | lesson_id | word_id | status |
      | 1500      | 2001    | active |
      | 1500      | 2003    | active |
    And the language_word_test_attempts table contains:
      | id   | word_id | direction        | mode | correct | created_at          | status |
      | 7001 | 2001    | source_to_target | free | true    | 2026-11-14T10:00:00 | active |
      | 7002 | 2001    | source_to_target | free | true    | 2026-11-15T10:00:00 | active |
      | 7003 | 2001    | target_to_source | free | true    | 2026-11-15T11:00:00 | active |
    When I GET /api/features/tasks/language/lessons/1500/result/score/history
    Then the response status code is 200
    And the response body includes:
      """
      {
        "points": [
          { "date": "2026-11-14", "score": 0.0833 },
          { "date": "2026-11-15", "score": 0.25 },
          { "date": "2026-11-16", "score": 0.25 }
        ]
      }
      """

  Scenario: GET the score history when nobody answered yet — no points
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
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
      | id   | word_id | direction        | mode | correct | created_at          | status |
    When I GET /api/features/tasks/language/lessons/1500/result/score/history
    Then the response status code is 200
    And the response body includes:
      """
      { "points": [] }
      """

  @error_case
  Scenario: GET the score history as a user without access to the project's tribe — 403
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id | tribe_id | person_id | position | status |
    When I GET /api/features/tasks/language/lessons/1500/result/score/history
    Then the response status code is 403
