@wip
Feature: Get translation candidates from the local dict.cc dictionary while creating a word
  As a project member creating a new word
  I want every matching translation looked up from the dict.cc data bundled with the app, so I can pick the one I meant
  So that I don't have to look up or type the translation myself, with no external service involved

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

  Scenario: GET translation candidates for a pair with no bundled dictionary — an empty result is returned, not an error
    Given I am authenticated as a regular user: user.id 0002
    And the bundled dictionary data directory is empty
    When I GET /api/features/tasks/language/translate-suggestion?text=chat&source_language=fr&target_language=en
    Then the response status code is 200
    And the response body is:
      """
      { "text": "chat", "source_language": "fr", "target_language": "en", "suggestions": [] }
      """

  Scenario: GET translation candidates matching several senses of the same word — every candidate is returned, with its own context, word type and the typed word's own article
    Given I am authenticated as a regular user: user.id 0002
    And the bundled dictionary archive "dict.de.fr.zip" contains a file with content:
      """
      # DE-FR vocabulary database
      Haus {n} [Gebäude]	maison {f}	noun
      Haus {n} [Haushalt, Hausgemeinschaft, Familie]	maisonnée {f}	noun
      """
    When I GET /api/features/tasks/language/translate-suggestion?text=Haus&source_language=de&target_language=fr
    Then the response status code is 200
    And the response body is:
      """
      {
        "text": "Haus", "source_language": "de", "target_language": "fr",
        "suggestions": [
          { "text": "maison", "article": "la", "context": "Gebäude", "word_type": "noun", "source_article": "das", "plural": null, "source_plural": null },
          { "text": "maisonnée", "article": "la", "context": "Haushalt, Hausgemeinschaft, Familie", "word_type": "noun", "source_article": "das", "plural": null, "source_plural": null }
        ]
      }
      """

  Scenario: GET translation candidates resolved from the reverse-direction archive — the article matches the requested target language
    Given I am authenticated as a regular user: user.id 0002
    And the bundled dictionary archive "dict.fr.de.zip" contains a file with content:
      """
      maison {f}	Haus {n}	noun
      """
    When I GET /api/features/tasks/language/translate-suggestion?text=maison&source_language=fr&target_language=de
    Then the response status code is 200
    And the response body is:
      """
      {
        "text": "maison", "source_language": "fr", "target_language": "de",
        "suggestions": [ { "text": "Haus", "article": "das", "context": null, "word_type": "noun", "source_article": "la", "plural": null, "source_plural": null } ]
      }
      """

  Scenario: GET translation candidates for a noun whose plural is in the dictionary — the plural of the typed word and of its translation are suggested
    Given I am authenticated as a regular user: user.id 0002
    And the bundled dictionary archive "dict.de.fr.zip" contains a file with content:
      """
      Kind {n}	enfant {m}	noun
      Kinder {pl}	enfants {m.pl}	noun
      """
    When I GET /api/features/tasks/language/translate-suggestion?text=Kind&source_language=de&target_language=fr
    Then the response status code is 200
    And the response body is:
      """
      {
        "text": "Kind", "source_language": "de", "target_language": "fr",
        "suggestions": [
          { "text": "enfant", "article": "le", "context": null, "word_type": "noun", "source_article": "das", "plural": "enfants", "source_plural": "Kinder" }
        ]
      }
      """

  Scenario: GET translation candidates for a noun with no plural in the dictionary — both plurals are empty
    Given I am authenticated as a regular user: user.id 0002
    And the bundled dictionary archive "dict.de.fr.zip" contains a file with content:
      """
      Kind {n}	enfant {m}	noun
      Kinder {pl}	enfants {m.pl}	noun
      Katze {f}	chat {m}	noun
      """
    When I GET /api/features/tasks/language/translate-suggestion?text=Katze&source_language=de&target_language=fr
    Then the response status code is 200
    And the response body is:
      """
      {
        "text": "Katze", "source_language": "de", "target_language": "fr",
        "suggestions": [
          { "text": "chat", "article": "le", "context": null, "word_type": "noun", "source_article": "die", "plural": null, "source_plural": null }
        ]
      }
      """

  Scenario: GET translation candidates in the reverse direction for a noun whose plural is in the dictionary — the plurals follow the requested direction
    Given I am authenticated as a regular user: user.id 0002
    And the bundled dictionary archive "dict.de.fr.zip" contains a file with content:
      """
      Mann {m}	homme {m}	noun
      Männer {pl}	hommes {m.pl}	noun
      """
    When I GET /api/features/tasks/language/translate-suggestion?text=homme&source_language=fr&target_language=de
    Then the response status code is 200
    And the response body is:
      """
      {
        "text": "homme", "source_language": "fr", "target_language": "de",
        "suggestions": [
          { "text": "Mann", "article": "der", "context": null, "word_type": "noun", "source_article": "le", "plural": "Männer", "source_plural": "hommes" }
        ]
      }
      """

  Scenario: GET translation candidates for a word not in the bundled dictionary — an empty result is returned
    Given I am authenticated as a regular user: user.id 0002
    And the bundled dictionary archive "dict.fr.en.zip" contains a file with content:
      """
      chat {m}	cat	noun
      """
    When I GET /api/features/tasks/language/translate-suggestion?text=chien&source_language=fr&target_language=en
    Then the response status code is 200
    And the response body is:
      """
      { "text": "chien", "source_language": "fr", "target_language": "en", "suggestions": [] }
      """

  @error_case
  Scenario: GET translation candidates as a user with no role at all — 403
    Given the users table contains:
      | id   | email                | status |
      | 0003 | profile_user@test.com | active |
    And I am authenticated as the person's owner: user.id 0003
    When I GET /api/features/tasks/language/translate-suggestion?text=chat&source_language=fr&target_language=en
    Then the response status code is 403
