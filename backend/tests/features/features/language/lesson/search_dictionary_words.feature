@wip
Feature: Autocomplete a word from the local dict.cc dictionary
  As a project member creating a new word
  I want the dictionary to suggest words starting with what I'm typing, in the same language
  So that I can find a word like the database already offers, without needing to type it in full

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

  Scenario: GET dictionary words by prefix on the source-language side — matches starting with the prefix are returned
    Given I am authenticated as a regular user: user.id 0002
    And the bundled dictionary archive "dict.fr.de.zip" contains a file with content:
      """
      jambe {f}	Bein {n}	noun
      jardin {m}	Garten {m}	noun
      chat {m}	Katze {f}	noun
      """
    When I GET /api/features/tasks/language/dictionary-words?language=fr&other_language=de&prefix=ja
    Then the response status code is 200
    And the response body is:
      """
      [
        { "text": "jambe", "word_type": "noun", "article": "la" },
        { "text": "jardin", "word_type": "noun", "article": "le" }
      ]
      """

  Scenario: GET dictionary words by prefix — results are ranked shortest-first, the closest match to what was typed
    Given I am authenticated as a regular user: user.id 0002
    And the bundled dictionary archive "dict.fr.de.zip" contains a file with content:
      """
      jardinage {m}	Gartenarbeit {f}	noun
      jardin {m}	Garten {m}	noun
      jambe {f}	Bein {n}	noun
      """
    When I GET /api/features/tasks/language/dictionary-words?language=fr&other_language=de&prefix=ja
    Then the response status code is 200
    And the response body is:
      """
      [
        { "text": "jambe", "word_type": "noun", "article": "la" },
        { "text": "jardin", "word_type": "noun", "article": "le" },
        { "text": "jardinage", "word_type": "noun", "article": "le" }
      ]
      """

  Scenario: GET dictionary words by prefix on the target-language side — the archive serves both sides
    Given I am authenticated as a regular user: user.id 0002
    And the bundled dictionary archive "dict.fr.de.zip" contains a file with content:
      """
      jambe {f}	Bein {n}	noun
      """
    When I GET /api/features/tasks/language/dictionary-words?language=de&other_language=fr&prefix=bei
    Then the response status code is 200
    And the response body is:
      """
      [ { "text": "Bein", "word_type": "noun", "article": "das" } ]
      """

  Scenario: GET dictionary words with no bundled dictionary for the pair — an empty list is returned
    Given I am authenticated as a regular user: user.id 0002
    And the bundled dictionary data directory is empty
    When I GET /api/features/tasks/language/dictionary-words?language=fr&other_language=en&prefix=ja
    Then the response status code is 200
    And the response body is:
      """
      []
      """

  @error_case
  Scenario: GET dictionary words as a user with no role at all — 403
    Given the users table contains:
      | id   | email                | status |
      | 0003 | profile_user@test.com | active |
    And I am authenticated as the person's owner: user.id 0003
    When I GET /api/features/tasks/language/dictionary-words?language=fr&other_language=de&prefix=ja
    Then the response status code is 403
