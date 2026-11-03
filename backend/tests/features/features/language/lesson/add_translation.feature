@wip
Feature: Add a translation to an existing word
  As a project member
  I want to link a translation to a word that's already in the dictionary
  So that reusing an existing word doesn't block me from also giving it a new translation

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
    And the languages table contains:
      | code | name    | status |
      | fr   | French  | active |
      | en   | English | active |

  Scenario: POST a brand-new translation to an existing word — it is created and linked
    Given I am authenticated as a regular user: user.id 0002
    And the language_words table contains:
      | id   | text | language | word_type | status |
      | 2001 | chat | fr       | noun      | active |
    And the language_word_translations table contains:
      | id | word_id_a | word_id_b | status |
    When I POST /api/features/tasks/language/words/2001/translations with body:
      """
      { "text": "cat", "language": "en", "word_type": "noun" }
      """
    Then the response status code is 201
    And the response body includes:
      """
      { "id": "2001", "text": "chat", "translations": [ { "text": "cat", "language": "en" } ] }
      """
    And the language_words table contains:
      | text | language | word_type | status |
      | chat | fr       | noun      | active |
      | cat  | en       | noun      | active |
    And the language_word_translations table contains:
      | status |
      | active |

  Scenario: POST an existing word as a translation to another existing word — they are linked
    Given I am authenticated as a regular user: user.id 0002
    And the language_words table contains:
      | id   | text | language | word_type | status |
      | 2001 | chat | fr       | noun      | active |
      | 2002 | cat  | en       | noun      | active |
    And the language_word_translations table contains:
      | id | word_id_a | word_id_b | status |
    When I POST /api/features/tasks/language/words/2001/translations with body:
      """
      { "word_id": "2002" }
      """
    Then the response status code is 201
    And the language_word_translations table contains:
      | status |
      | active |

  Scenario: POST a translation that is already linked — 409 and nothing changes
    Given I am authenticated as a regular user: user.id 0002
    And the language_words table contains:
      | id   | text | language | word_type | status |
      | 2001 | chat | fr       | noun      | active |
      | 2002 | cat  | en       | noun      | active |
    And the language_word_translations table contains:
      | id   | word_id_a | word_id_b | status |
      | 4001 | 2001      | 2002      | active |
    When I POST /api/features/tasks/language/words/2001/translations with body:
      """
      { "word_id": "2002" }
      """
    Then the response status code is 409
    And the language_word_translations table contains:
      | word_id_a | word_id_b | status |
      | 2001      | 2002      | active |

  Scenario: POST a word as its own translation — 422 and nothing changes
    Given I am authenticated as a regular user: user.id 0002
    And the language_words table contains:
      | id   | text | language | word_type | status |
      | 2001 | chat | fr       | noun      | active |
    And the language_word_translations table contains:
      | id | word_id_a | word_id_b | status |
    When I POST /api/features/tasks/language/words/2001/translations with body:
      """
      { "word_id": "2001" }
      """
    Then the response status code is 422
    And the language_word_translations table contains:
      | id | word_id_a | word_id_b | status |

  Scenario: POST a translation to an unknown word — 404
    Given I am authenticated as a regular user: user.id 0002
    When I POST /api/features/tasks/language/words/9999/translations with body:
      """
      { "text": "cat", "language": "en", "word_type": "noun" }
      """
    Then the response status code is 404
