@wip
Feature: Update a word in the shared dictionary
  As a project member
  I want to fix or refine a word's own fields after creating it
  So that a typo or a missing article/plural doesn't need a brand-new word

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
      | code | name   | status |
      | fr   | French | active |

  Scenario: PATCH a word's own fields — they are updated and its declensions are replaced
    Given I am authenticated as a regular user: user.id 0002
    And the language_words table contains:
      | id   | text | language | word_type | article | plural | status |
      | 2001 | chet | fr       | noun      | le      | chets  | active |
    And the language_word_declensions table contains:
      | id   | word_id | case_label | form     | position | status |
      | 3001 | 2001    | old        | old-form | 1        | active |
    When I PATCH /api/features/tasks/language/words/2001 with body:
      """
      {
        "text": "chat", "word_type": "noun", "article": "le", "plural": "chats",
        "declensions": [ { "case_label": "new", "form": "new-form" } ]
      }
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "id": "2001", "text": "chat", "language": "fr", "article": "le", "plural": "chats",
        "declensions": [ { "case_label": "new", "form": "new-form" } ]
      }
      """
    And the language_words table contains:
      | id   | text | language | word_type | article | plural | status |
      | 2001 | chat | fr       | noun      | le      | chats  | active |

  Scenario: PATCH a word's text to one that already exists for that language — 409 and nothing changes
    Given I am authenticated as a regular user: user.id 0002
    And the language_words table contains:
      | id   | text  | language | word_type | status |
      | 2001 | chat  | fr       | noun      | active |
      | 2002 | chien | fr       | noun      | active |
    When I PATCH /api/features/tasks/language/words/2002 with body:
      """
      { "text": "chat", "word_type": "noun" }
      """
    Then the response status code is 409
    And the language_words table contains:
      | id   | text  | language | word_type | status |
      | 2001 | chat  | fr       | noun      | active |
      | 2002 | chien | fr       | noun      | active |

  Scenario: PATCH an unknown word — 404
    Given I am authenticated as a regular user: user.id 0002
    When I PATCH /api/features/tasks/language/words/9999 with body:
      """
      { "text": "chat", "word_type": "noun" }
      """
    Then the response status code is 404
