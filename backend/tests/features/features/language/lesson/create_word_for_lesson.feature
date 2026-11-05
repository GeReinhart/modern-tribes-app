@wip
Feature: Create a new word for a lesson
  As a project member
  I want to create a brand-new word with its translation and add it straight to a lesson
  So that the word becomes part of the project's lesson and of the global dictionary at the same time

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

  Scenario: POST a new word with a brand-new translation — both words are created, linked, and the word is added to the lesson
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the language_words table contains:
      | id | text | language | word_type | article | plural | status |
    And the language_word_translations table contains:
      | id | word_id_a | word_id_b | status |
    And the language_lesson_words table contains:
      | lesson_id | word_id | status |
    When I POST /api/features/tasks/language/lessons/1500/words with body:
      """
      {
        "text": "chat",
        "language": "fr",
        "word_type": "noun",
        "article": "le",
        "plural": "chats",
        "translations": [
          { "text": "cat", "language": "en", "word_type": "noun", "plural": "cats" }
        ]
      }
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "text": "chat",
        "language": "fr",
        "word_type": "noun",
        "article": "le",
        "plural": "chats",
        "translations": [ { "text": "cat", "language": "en", "word_type": "noun", "plural": "cats" } ]
      }
      """
    And the language_words table contains:
      | text | language | word_type | article | plural | status |
      | chat | fr       | noun      | le      | chats  | active |
      | cat  | en       | noun      |         | cats   | active |
    And the language_word_translations table contains:
      | status |
      | active |
    And the language_lesson_words table contains:
      | lesson_id | status |
      | 1500      | active |

  Scenario: POST a new word whose translation already exists in the global dictionary — the existing word is reused, not duplicated
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the language_words table contains:
      | id   | text | language | word_type | article | plural | status |
      | 2002 | cat  | en       | noun      |         | cats   | active |
    And the language_word_translations table contains:
      | id | word_id_a | word_id_b | status |
    And the language_lesson_words table contains:
      | lesson_id | word_id | status |
    When I POST /api/features/tasks/language/lessons/1500/words with body:
      """
      {
        "text": "chat",
        "language": "fr",
        "word_type": "noun",
        "article": "le",
        "plural": "chats",
        "translations": [ { "word_id": "2002" } ]
      }
      """
    Then the response status code is 201
    And the response body includes:
      """
      { "text": "chat", "language": "fr", "translations": [ { "id": "2002", "text": "cat", "language": "en" } ] }
      """
    And the language_words table contains:
      | text | language | word_type | article | plural | status |
      | cat  | en       | noun      |         | cats   | active |
      | chat | fr       | noun      | le      | chats  | active |
    And the language_word_translations table contains:
      | status |
      | active |
    And the language_lesson_words table contains:
      | lesson_id | status |
      | 1500      | active |

  Scenario: POST a new word whose text already exists for that language — 409 and nothing is created
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the language_words table contains:
      | id   | text | language | word_type | article | plural | status |
      | 2001 | chat | fr       | noun      | le      | chats  | active |
    And the language_word_translations table contains:
      | id | word_id_a | word_id_b | status |
    And the language_lesson_words table contains:
      | lesson_id | word_id | status |
    When I POST /api/features/tasks/language/lessons/1500/words with body:
      """
      {
        "text": "chat",
        "language": "fr",
        "word_type": "noun",
        "translations": [ { "text": "cat", "language": "en", "word_type": "noun" } ]
      }
      """
    Then the response status code is 409
    And the language_words table contains:
      | id   | text | language | word_type | article | plural | status |
      | 2001 | chat | fr       | noun      | le      | chats  | active |
    And the language_lesson_words table contains:
      | lesson_id | word_id | status |

  Scenario: POST a new word of type "other" (e.g. an adverb) — it is created with that type, without article or plural, and added to the lesson
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the language_words table contains:
      | id | text | language | word_type | article | plural | status |
    And the language_word_translations table contains:
      | id | word_id_a | word_id_b | status |
    And the language_lesson_words table contains:
      | lesson_id | word_id | status |
    When I POST /api/features/tasks/language/lessons/1500/words with body:
      """
      {
        "text": "vite",
        "language": "fr",
        "word_type": "other",
        "translations": [ { "text": "quickly", "language": "en", "word_type": "other" } ]
      }
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "text": "vite",
        "language": "fr",
        "word_type": "other",
        "translations": [ { "text": "quickly", "language": "en", "word_type": "other" } ]
      }
      """
    And the language_words table contains:
      | text    | language | word_type | article | plural | status |
      | vite    | fr       | other     |         |        | active |
      | quickly | en       | other     |         |        | active |
    And the language_word_translations table contains:
      | status |
      | active |
    And the language_lesson_words table contains:
      | lesson_id | status |
      | 1500      | active |

  @error_case
  Scenario: POST a new word as a user without access to the project's tribe — 403 and nothing is created
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
    And the language_words table contains:
      | id | text | language | word_type | article | plural | status |
    And the language_lesson_words table contains:
      | lesson_id | word_id | status |
    When I POST /api/features/tasks/language/lessons/1500/words with body:
      """
      {
        "text": "chat",
        "language": "fr",
        "word_type": "noun",
        "translations": [ { "text": "cat", "language": "en", "word_type": "noun" } ]
      }
      """
    Then the response status code is 403
    And the language_words table contains:
      | id | text | language | word_type | article | plural | status |
    And the language_lesson_words table contains:
      | lesson_id | word_id | status |
