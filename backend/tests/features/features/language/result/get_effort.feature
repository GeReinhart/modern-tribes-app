@wip
Feature: See the effort put into a lesson over time
  As a project member
  I want to see how much I answered each day, split between successes and errors
  So that I can follow my effort, not only my score

  Each answer weighs 1 when typed freely (or for an article or a plural) and 0.2 when picked
  among choices; the weight applies to successes and errors alike. The days run from the first
  answer until today, a day without any answer being empty.

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

  Scenario: GET the effort — one entry per day from the first answer until today, weighted successes and errors, empty days included
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
      | id   | word_id | direction        | mode   | correct | created_at          | status |
      | 7001 | 2001    | source_to_target | free   | true    | 2026-11-14T10:00:00 | active |
      | 7002 | 2001    | source_to_target | choice | true    | 2026-11-14T10:05:00 | active |
      | 7003 | 2001    | target_to_source | free   | false   | 2026-11-14T10:10:00 | active |
      | 7004 | 2001    | article          | free   | true    | 2026-11-16T09:00:00 | active |
    When I GET /api/features/tasks/language/lessons/1500/result/effort
    Then the response status code is 200
    And the response body includes:
      """
      {
        "days": [
          { "date": "2026-11-14", "success": 1.2, "errors": 1.0 },
          { "date": "2026-11-15", "success": 0.0, "errors": 0.0 },
          { "date": "2026-11-16", "success": 1.0, "errors": 0.0 }
        ]
      }
      """

  Scenario: GET the effort when nobody answered yet — no days
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
    When I GET /api/features/tasks/language/lessons/1500/result/effort
    Then the response status code is 200
    And the response body includes:
      """
      { "days": [] }
      """

  @error_case
  Scenario: GET the effort as a user without access to the project's tribe — 403
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id | tribe_id | person_id | position | status |
    When I GET /api/features/tasks/language/lessons/1500/result/effort
    Then the response status code is 403
