@wip
Feature: See a lesson's overall test score
  As a project member testing my knowledge of a lesson
  I want to see my overall score for the lesson and how it evolves
  So that I know how well I know it and which words need review

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

  Scenario: GET a lesson's score — it is the average of its words' scores, recently tested so no decay applies
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
      | 7001 | 2001    | source_to_target | free | true    | 2026-11-13T10:00:00 | active |
      | 7002 | 2001    | source_to_target | free | true    | 2026-11-14T10:00:00 | active |
      | 7003 | 2001    | source_to_target | free | true    | 2026-11-15T10:00:00 | active |
      | 7004 | 2003    | source_to_target | free | true    | 2026-11-13T10:00:00 | active |
      | 7005 | 2003    | source_to_target | free | true    | 2026-11-14T10:00:00 | active |
      | 7006 | 2003    | source_to_target | free | true    | 2026-11-15T10:00:00 | active |
      | 7007 | 2003    | target_to_source | free | true    | 2026-11-13T10:00:00 | active |
      | 7008 | 2003    | target_to_source | free | true    | 2026-11-14T10:00:00 | active |
      | 7009 | 2003    | target_to_source | free | true    | 2026-11-15T10:00:00 | active |
    When I GET /api/features/tasks/language/lessons/1500/test/score
    Then the response status code is 200
    And the response body includes:
      """
      {
        "overall_score": 0.75,
        "words": [
          { "word_id": "2001", "score": 0.5 },
          { "word_id": "2003", "score": 1.0 }
        ]
      }
      """

  Scenario: GET a lesson's score — a word untested for two full weeks has its score decayed by 10% per week
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the language_words table contains:
      | id   | text | language | word_type | status |
      | 2001 | chat | fr       | noun      | active |
      | 2002 | cat  | en       | noun      | active |
    And the language_word_translations table contains:
      | id   | word_id_a | word_id_b | status |
      | 4001 | 2001      | 2002      | active |
    And the language_lesson_words table contains:
      | lesson_id | word_id | status |
      | 1500      | 2001    | active |
    And the language_word_test_attempts table contains:
      | id   | word_id | direction        | mode | correct | created_at          | status |
      | 7001 | 2001    | source_to_target | free | true    | 2026-10-30T10:00:00 | active |
      | 7002 | 2001    | source_to_target | free | true    | 2026-10-31T10:00:00 | active |
      | 7003 | 2001    | source_to_target | free | true    | 2026-11-01T10:00:00 | active |
    When I GET /api/features/tasks/language/lessons/1500/test/score
    Then the response status code is 200
    And the response body includes:
      """
      {
        "overall_score": 0.405,
        "words": [
          { "word_id": "2001", "score": 0.405 }
        ]
      }
      """

  Scenario: GET a lesson's score — answers given in the reverse direction (recorded on the word's translation) count for the lesson word, so three days in each direction reach 1.0
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the language_words table contains:
      | id   | text | language | word_type | status |
      | 2001 | chat | fr       | noun      | active |
      | 2002 | cat  | en       | noun      | active |
    And the language_word_translations table contains:
      | id   | word_id_a | word_id_b | status |
      | 4001 | 2001      | 2002      | active |
    And the language_lesson_words table contains:
      | lesson_id | word_id | status |
      | 1500      | 2001    | active |
    And the language_word_test_attempts table contains:
      | id   | word_id | direction        | mode | correct | created_at          | status |
      | 7001 | 2001    | source_to_target | free | true    | 2026-11-13T10:00:00 | active |
      | 7002 | 2001    | source_to_target | free | true    | 2026-11-14T10:00:00 | active |
      | 7003 | 2001    | source_to_target | free | true    | 2026-11-15T10:00:00 | active |
      | 7004 | 2002    | target_to_source | free | true    | 2026-11-13T10:00:00 | active |
      | 7005 | 2002    | target_to_source | free | true    | 2026-11-14T10:00:00 | active |
      | 7006 | 2002    | target_to_source | free | true    | 2026-11-15T10:00:00 | active |
    When I GET /api/features/tasks/language/lessons/1500/test/score
    Then the response status code is 200
    And the response body includes:
      """
      { "overall_score": 1.0, "words": [ { "word_id": "2001", "score": 1.0 } ] }
      """

  @error_case
  Scenario: GET a lesson's score as a user without access to the project's tribe — 403
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id | tribe_id | person_id | position | status |
    When I GET /api/features/tasks/language/lessons/1500/test/score
    Then the response status code is 403
