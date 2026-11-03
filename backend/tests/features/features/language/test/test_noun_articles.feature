@wip
Feature: Test the articles of nouns
  As a project member learning a language with articles (e.g. French "le chat")
  I want to be asked the article of a noun among the language's articles
  So that I learn nouns together with their article, and so that this counts in the word's score

  A word's score is made of points: 6 for each translation direction (2 points per distinct day of
  correct answers, 3 days needed), plus, when its learned-language noun has an article, 3 points
  for the article (1 point per distinct day, 3 days needed). A correct article answer always counts
  as a full day (it is picked among a few articles, but the day-by-day requirement already prevents
  cramming). The score is the points earned over the points possible for that word, so a noun with
  an article but no plural is out of 15.

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
      | 0020       | en               | fr               | active |
    And the documents table contains:
      | id   | status |
      | 0500 | active |
    And the language_lessons table contains:
      | id   | project_id | title                 | document_id | status |
      | 1500 | 0020       | Chapter 1 - Greetings | 0500        | active |

  Scenario: POST a correct article answer — it is recorded on the noun shown, and the lesson word's score gains one of its 15 possible points
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the language_words table contains:
      | id   | text | language | word_type | article | status |
      | 2001 | chat | fr       | noun      | le      | active |
      | 2002 | cat  | en       | noun      |         | active |
    And the language_word_translations table contains:
      | id   | word_id_a | word_id_b | status |
      | 4001 | 2001      | 2002      | active |
    And the language_lesson_words table contains:
      | lesson_id | word_id | status |
      | 1500      | 2002    | active |
    And the language_word_test_attempts table contains:
      | id   | word_id | direction        | mode   | correct | created_at          | status |
    When I POST /api/features/tasks/language/lessons/1500/test/attempts with body:
      """
      { "word_id": "2001", "direction": "article", "mode": "choice", "answer": "le" }
      """
    Then the response status code is 201
    And the response body includes:
      """
      { "correct": true, "correct_answer": "le", "word_score": 0.0667 }
      """
    And the language_word_test_attempts table contains:
      | word_id | direction | mode   | correct | status |
      | 2001    | article   | choice | true    | active |

  Scenario: POST a wrong article answer — the right article is given back and no credit is added
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the language_words table contains:
      | id   | text | language | word_type | article | status |
      | 2001 | chat | fr       | noun      | le      | active |
      | 2002 | cat  | en       | noun      |         | active |
    And the language_word_translations table contains:
      | id   | word_id_a | word_id_b | status |
      | 4001 | 2001      | 2002      | active |
    And the language_lesson_words table contains:
      | lesson_id | word_id | status |
      | 1500      | 2002    | active |
    And the language_word_test_attempts table contains:
      | id   | word_id | direction        | mode   | correct | created_at          | status |
    When I POST /api/features/tasks/language/lessons/1500/test/attempts with body:
      """
      { "word_id": "2001", "direction": "article", "mode": "choice", "answer": "la" }
      """
    Then the response status code is 201
    And the response body includes:
      """
      { "correct": false, "correct_answer": "le", "word_score": 0.0 }
      """
    And the language_word_test_attempts table contains:
      | word_id | direction | mode   | correct | status |
      | 2001    | article   | choice | false   | active |

  Scenario: POST an article answer for a word that has no article — 422 and no attempt is recorded
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the language_words table contains:
      | id   | text | language | word_type | article | status |
      | 2001 | chat | fr       | noun      | le      | active |
      | 2002 | cat  | en       | noun      |         | active |
    And the language_word_translations table contains:
      | id   | word_id_a | word_id_b | status |
      | 4001 | 2001      | 2002      | active |
    And the language_lesson_words table contains:
      | lesson_id | word_id | status |
      | 1500      | 2002    | active |
    And the language_word_test_attempts table contains:
      | id   | word_id | direction        | mode   | correct | created_at          | status |
    When I POST /api/features/tasks/language/lessons/1500/test/attempts with body:
      """
      { "word_id": "2002", "direction": "article", "mode": "choice", "answer": "the" }
      """
    Then the response status code is 422
    And the language_word_test_attempts table contains:
      | id | word_id | direction | mode | correct | created_at | status |

  Scenario: GET a lesson's score — a noun with an article, fully known in both translation directions but whose article was never tested, is at 12 points out of 15
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the language_words table contains:
      | id   | text | language | word_type | article | status |
      | 2001 | chat | fr       | noun      | le      | active |
      | 2002 | cat  | en       | noun      |         | active |
    And the language_word_translations table contains:
      | id   | word_id_a | word_id_b | status |
      | 4001 | 2001      | 2002      | active |
    And the language_lesson_words table contains:
      | lesson_id | word_id | status |
      | 1500      | 2002    | active |
    And the language_word_test_attempts table contains:
      | id   | word_id | direction        | mode   | correct | created_at          | status |
      | 7001 | 2002    | source_to_target | free   | true    | 2026-11-13T10:00:00 | active |
      | 7002 | 2002    | source_to_target | free   | true    | 2026-11-14T10:00:00 | active |
      | 7003 | 2002    | source_to_target | free   | true    | 2026-11-15T10:00:00 | active |
      | 7004 | 2001    | target_to_source | free   | true    | 2026-11-13T10:00:00 | active |
      | 7005 | 2001    | target_to_source | free   | true    | 2026-11-14T10:00:00 | active |
      | 7006 | 2001    | target_to_source | free   | true    | 2026-11-15T10:00:00 | active |
    When I GET /api/features/tasks/language/lessons/1500/test/score
    Then the response status code is 200
    And the response body includes:
      """
      { "overall_score": 0.8, "words": [ { "word_id": "2002", "score": 0.8 } ] }
      """

  Scenario: GET a lesson's score — three distinct days of correct article answers complete the noun's score
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the language_words table contains:
      | id   | text | language | word_type | article | status |
      | 2001 | chat | fr       | noun      | le      | active |
      | 2002 | cat  | en       | noun      |         | active |
    And the language_word_translations table contains:
      | id   | word_id_a | word_id_b | status |
      | 4001 | 2001      | 2002      | active |
    And the language_lesson_words table contains:
      | lesson_id | word_id | status |
      | 1500      | 2002    | active |
    And the language_word_test_attempts table contains:
      | id   | word_id | direction        | mode   | correct | created_at          | status |
      | 7001 | 2002    | source_to_target | free   | true    | 2026-11-13T10:00:00 | active |
      | 7002 | 2002    | source_to_target | free   | true    | 2026-11-14T10:00:00 | active |
      | 7003 | 2002    | source_to_target | free   | true    | 2026-11-15T10:00:00 | active |
      | 7004 | 2001    | target_to_source | free   | true    | 2026-11-13T10:00:00 | active |
      | 7005 | 2001    | target_to_source | free   | true    | 2026-11-14T10:00:00 | active |
      | 7006 | 2001    | target_to_source | free   | true    | 2026-11-15T10:00:00 | active |
      | 7007 | 2001    | article          | choice | true    | 2026-11-13T11:00:00 | active |
      | 7008 | 2001    | article          | choice | true    | 2026-11-14T11:00:00 | active |
      | 7009 | 2001    | article          | choice | true    | 2026-11-15T11:00:00 | active |
    When I GET /api/features/tasks/language/lessons/1500/test/score
    Then the response status code is 200
    And the response body includes:
      """
      { "overall_score": 1.0, "words": [ { "word_id": "2002", "score": 1.0 } ] }
      """

  @error_case
  Scenario: POST an article answer as a user without access to the project's tribe — 403 and no attempt is recorded
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id | tribe_id | person_id | position | status |
    And the language_words table contains:
      | id   | text | language | word_type | article | status |
      | 2001 | chat | fr       | noun      | le      | active |
      | 2002 | cat  | en       | noun      |         | active |
    And the language_word_translations table contains:
      | id   | word_id_a | word_id_b | status |
      | 4001 | 2001      | 2002      | active |
    And the language_lesson_words table contains:
      | lesson_id | word_id | status |
      | 1500      | 2002    | active |
    And the language_word_test_attempts table contains:
      | id   | word_id | direction        | mode   | correct | created_at          | status |
    When I POST /api/features/tasks/language/lessons/1500/test/attempts with body:
      """
      { "word_id": "2001", "direction": "article", "mode": "choice", "answer": "le" }
      """
    Then the response status code is 403
    And the language_word_test_attempts table contains:
      | id | word_id | direction | mode | correct | created_at | status |
