@wip
Feature: Submit a test answer for a word
  As a project member testing my knowledge of a lesson
  I want to answer a word's translation, either by typing it freely or by picking it among choices
  So that the system tells me if I'm right and tracks my own progress on that word

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
    And the language_settings table contains:
      | project_id | source_language | target_language | status |
      | 0020       | fr               | en               | active |
    And the documents table contains:
      | id   | status |
      | 0500 | active |
    And the language_lessons table contains:
      | id   | project_id | title                 | document_id | status |
      | 1500 | 0020       | Chapter 1 - Greetings | 0500        | active |

  Scenario: POST a correct free-translation answer for a word tested for the first time — the word's score reflects one of the six needed successes
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
      | id | word_id | direction        | mode | correct | created_at | status |
    When I POST /api/features/tasks/language/lessons/1500/test/attempts with body:
      """
      { "word_id": "2001", "direction": "source_to_target", "mode": "free", "answer": "cat" }
      """
    Then the response status code is 201
    And the response body includes:
      """
      { "correct": true, "correct_answer": "cat", "word_score": 0.1667 }
      """
    And the language_word_test_attempts table contains:
      | word_id | direction        | mode | correct | status |
      | 2001    | source_to_target | free | true    | active |

  Scenario: POST a correct answer in the reverse direction (the translation is shown, the lesson's word is expected) — it is recorded on the shown word and the returned score is the lesson word's, which gains one of the six needed successes
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
      | id | word_id | direction        | mode | correct | created_at | status |
    When I POST /api/features/tasks/language/lessons/1500/test/attempts with body:
      """
      { "word_id": "2002", "direction": "target_to_source", "mode": "free", "answer": "chat" }
      """
    Then the response status code is 201
    And the response body includes:
      """
      { "correct": true, "correct_answer": "chat", "word_score": 0.1667 }
      """
    And the language_word_test_attempts table contains:
      | word_id | direction        | mode | correct | status |
      | 2002    | target_to_source | free | true    | active |

  Scenario: POST a wrong free-translation answer — the correct answer is given back and no credit is added
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
      | id | word_id | direction        | mode | correct | created_at | status |
    When I POST /api/features/tasks/language/lessons/1500/test/attempts with body:
      """
      { "word_id": "2001", "direction": "source_to_target", "mode": "free", "answer": "dog" }
      """
    Then the response status code is 201
    And the response body includes:
      """
      { "correct": false, "correct_answer": "cat", "word_score": 0.0 }
      """
    And the language_word_test_attempts table contains:
      | word_id | direction        | mode | correct | status |
      | 2001    | source_to_target | free | false   | active |

  Scenario: POST a correct multiple-choice answer on a different day than a previous free success — it adds only a fifth of a day's credit
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the language_words table contains:
      | id   | text   | language | word_type | status |
      | 2001 | chat   | fr       | noun      | active |
      | 2002 | cat    | en       | noun      | active |
      | 2003 | chien  | fr       | noun      | active |
      | 2004 | oiseau | fr       | noun      | active |
      | 2005 | cheval | fr       | noun      | active |
    And the language_word_translations table contains:
      | id   | word_id_a | word_id_b | status |
      | 4001 | 2001      | 2002      | active |
    And the language_lesson_words table contains:
      | lesson_id | word_id | status |
      | 1500      | 2001    | active |
      | 1500      | 2003    | active |
      | 1500      | 2004    | active |
      | 1500      | 2005    | active |
    And the language_word_test_attempts table contains:
      | id   | word_id | direction        | mode | correct | created_at          | status |
      | 7001 | 2001    | source_to_target | free | true    | 2026-11-01T10:00:00 | active |
    When I POST /api/features/tasks/language/lessons/1500/test/attempts with body:
      """
      { "word_id": "2001", "direction": "source_to_target", "mode": "choice", "chosen_word_id": "2002" }
      """
    Then the response status code is 201
    And the response body includes:
      """
      { "correct": true, "correct_answer": "cat", "word_score": 0.2 }
      """
    And the language_word_test_attempts table contains:
      | word_id | direction        | mode   | correct | status |
      | 2001    | source_to_target | free   | true    | active |
      | 2001    | source_to_target | choice | true    | active |

  Scenario: POST a multiple-choice answer when the lesson has fewer than 4 words of the same type — 422 and no attempt is recorded
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the language_words table contains:
      | id   | text  | language | word_type | status |
      | 2001 | chat  | fr       | noun      | active |
      | 2002 | cat   | en       | noun      | active |
      | 2003 | chien | fr       | noun      | active |
    And the language_word_translations table contains:
      | id   | word_id_a | word_id_b | status |
      | 4001 | 2001      | 2002      | active |
    And the language_lesson_words table contains:
      | lesson_id | word_id | status |
      | 1500      | 2001    | active |
      | 1500      | 2003    | active |
    And the language_word_test_attempts table contains:
      | id | word_id | direction | mode | correct | created_at | status |
    When I POST /api/features/tasks/language/lessons/1500/test/attempts with body:
      """
      { "word_id": "2001", "direction": "source_to_target", "mode": "choice", "chosen_word_id": "2002" }
      """
    Then the response status code is 422
    And the language_word_test_attempts table contains:
      | id | word_id | direction | mode | correct | created_at | status |

  @error_case
  Scenario: POST a test answer as a user without access to the project's tribe — 403 and no attempt is recorded
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id | tribe_id | person_id | position | status |
    And the language_words table contains:
      | id   | text | language | word_type | status |
      | 2001 | chat | fr       | noun      | active |
      | 2002 | cat  | en       | noun      | active |
    And the language_lesson_words table contains:
      | lesson_id | word_id | status |
      | 1500      | 2001    | active |
    And the language_word_test_attempts table contains:
      | id | word_id | direction | mode | correct | created_at | status |
    When I POST /api/features/tasks/language/lessons/1500/test/attempts with body:
      """
      { "word_id": "2001", "direction": "source_to_target", "mode": "free", "answer": "cat" }
      """
    Then the response status code is 403
    And the language_word_test_attempts table contains:
      | id | word_id | direction | mode | correct | created_at | status |
