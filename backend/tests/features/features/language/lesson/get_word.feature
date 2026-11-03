@wip
Feature: Get a dictionary word with its translations
  As a project member adding a word to a lesson
  I want to read an existing word together with its translations
  So that picking a word already used in another lesson brings its translation along, instead of asking me to type it again

  A word's test score is per user and per word, not per lesson, so a word reused in another lesson
  keeps its score automatically: nothing needs to be copied for it.

  Background:
    Given the users table contains:
      | id   | email          | status |
      | 0002 | user@test.com  | active |
      | 0003 | other@test.com | active |
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
    And the language_words table contains:
      | id   | text  | language | word_type | article | plural | status |
      | 2001 | chat  | fr       | noun      | le      | chats  | active |
      | 2002 | cat   | en       | noun      |         | cats   | active |
    And the language_word_translations table contains:
      | id   | word_id_a | word_id_b | status |
      | 4001 | 2001      | 2002      | active |

  Scenario: GET a word that has a translation — the word and its translation are returned
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tasks/language/words/2001
    Then the response status code is 200
    And the response body includes:
      """
      {
        "id": "2001", "text": "chat", "language": "fr", "word_type": "noun", "article": "le", "plural": "chats",
        "translations": [ { "id": "2002", "text": "cat", "language": "en", "plural": "cats" } ]
      }
      """

  Scenario: GET the translation side of a pair — the link works both ways
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tasks/language/words/2002
    Then the response status code is 200
    And the response body includes:
      """
      { "id": "2002", "text": "cat", "translations": [ { "id": "2001", "text": "chat", "article": "le" } ] }
      """

  Scenario: GET an unknown word — 404
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tasks/language/words/9999
    Then the response status code is 404

  @error_case
  Scenario: GET a word as a user without access to the projects' tribes — 403
    Given I am authenticated as a regular user: user.id 0003
    When I GET /api/features/tasks/language/words/2001
    Then the response status code is 403
