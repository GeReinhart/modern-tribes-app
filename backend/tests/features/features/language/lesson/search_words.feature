@wip
Feature: Search the shared word dictionary
  As a project member building a lesson
  I want to search the global dictionary by text, optionally filtered by language
  So that I can find and reuse an existing word instead of creating a duplicate

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
    And the language_words table contains:
      | id   | text  | language | word_type | status |
      | 2001 | chat  | fr       | noun      | active |
      | 2002 | chien | fr       | noun      | active |
      | 2003 | cat   | en       | noun      | active |

  Scenario: GET a dictionary search by text — matching words of any language are returned
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tasks/language/words?search=ch
    Then the response status code is 200
    And the response body includes:
      """
      [
        { "id": "2001", "text": "chat", "language": "fr" },
        { "id": "2002", "text": "chien", "language": "fr" }
      ]
      """

  Scenario: GET a dictionary search filtered by language — only that language's matches are returned
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tasks/language/words?search=c&language=en
    Then the response status code is 200
    And the response body is:
      """
      [ { "id": "2003", "text": "cat", "language": "en", "word_type": "noun" } ]
      """

  Scenario: GET a dictionary search — an exact match is ranked before a mere prefix match, itself ranked before a word that only contains the query
    Given the language_words table contains:
      | id   | text        | language | word_type | status |
      | 2004 | casse-tête  | fr       | noun      | active |
      | 2005 | tête-à-tête | fr       | noun      | active |
      | 2006 | tête        | fr       | noun      | active |
    And I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tasks/language/words?search=tête&language=fr
    Then the response status code is 200
    And the response body is:
      """
      [
        { "id": "2006", "text": "tête", "language": "fr", "word_type": "noun" },
        { "id": "2005", "text": "tête-à-tête", "language": "fr", "word_type": "noun" },
        { "id": "2004", "text": "casse-tête", "language": "fr", "word_type": "noun" }
      ]
      """
