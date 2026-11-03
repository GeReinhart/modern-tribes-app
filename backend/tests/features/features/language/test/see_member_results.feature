@wip
Feature: See a lesson's test results for any project member
  As a project member
  I want to pick a member of the project and see their results on a lesson
  So that I can follow how everyone (including me, by default) knows each word

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
    And the persons table contains:
      | id   | first_name | last_name | status |
      | 0031 | Leo        | Learner   | active |
      | 0032 | Zoe        | Outsider  | active |
    And the users table contains:
      | id   | email        | person_id | status |
      | 0003 | leo@test.com | 0031      | active |
      | 0004 | zoe@test.com | 0032      | active |
    And the languages table contains:
      | code | name    | status |
      | fr   | French  | active |
      | en   | English | active |
    And the tribes table contains:
      | id   | name | status |
      | 0010 | Band | active |
      | 0011 | Choir | active |
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

  Scenario: GET the lesson's test members — every person with access to the project is listed, people from unrelated tribes are not
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
      | 1002 | 0010     | 0031      | member   | active |
      | 1003 | 0011     | 0032      | member   | active |
    When I GET /api/features/tasks/language/lessons/1500/test/members
    Then the response status code is 200
    And the response body includes:
      """
      [
        { "user_id": "0003", "name": "Leo Learner" },
        { "user_id": "0002", "name": "Mia Member" }
      ]
      """

  Scenario: GET the lesson's score for another member — it is that member's own score, with each word's attempt history
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
      | 1002 | 0010     | 0031      | member   | active |
      | 1003 | 0011     | 0032      | member   | active |
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
      | id   | user_id | word_id | direction        | mode   | correct | created_at          | status |
      | 7001 | 0003    | 2001    | source_to_target | free   | true    | 2026-11-15T10:00:00 | active |
      | 7002 | 0003    | 2001    | target_to_source | choice | false   | 2026-11-15T10:05:00 | active |
    When I GET /api/features/tasks/language/lessons/1500/test/score?user_id=0003
    Then the response status code is 200
    And the response body includes:
      """
      {
        "overall_score": 0.1667,
        "words": [
          {
            "word_id": "2001",
            "score": 0.1667,
            "attempts": [
              { "direction": "source_to_target", "mode": "free", "correct": true },
              { "direction": "target_to_source", "mode": "choice", "correct": false }
            ]
          }
        ]
      }
      """

  Scenario: GET the lesson's score without a user — it is the signed-in user's own, here with no attempt yet
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
      | 1002 | 0010     | 0031      | member   | active |
      | 1003 | 0011     | 0032      | member   | active |
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
      | id   | user_id | word_id | direction        | mode | correct | created_at          | status |
      | 7001 | 0003    | 2001    | source_to_target | free | true    | 2026-11-15T10:00:00 | active |
    When I GET /api/features/tasks/language/lessons/1500/test/score
    Then the response status code is 200
    And the response body includes:
      """
      { "overall_score": 0.0, "words": [ { "word_id": "2001", "score": 0.0, "attempts": [] } ] }
      """

  Scenario: GET the lesson's score for a person who is not a member of the project — 404
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
      | 1002 | 0010     | 0031      | member   | active |
      | 1003 | 0011     | 0032      | member   | active |
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
    When I GET /api/features/tasks/language/lessons/1500/test/score?user_id=0004
    Then the response status code is 404

  @error_case
  Scenario: GET the lesson's test members as a user without access to the project's tribe — 403
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id | tribe_id | person_id | position | status |
    When I GET /api/features/tasks/language/lessons/1500/test/members
    Then the response status code is 403
