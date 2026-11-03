@wip
Feature: Get a translation from an online service when the dictionary has none
  As a project member creating a new word that the bundled dictionary does not know
  I want to explicitly ask an online translation service
  So that I can still get a translation suggestion, knowing my text is sent to that service only when I ask

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

  Scenario: GET an online translation when the service is configured — one suggestion marked as online is returned, without article or plural
    Given I am authenticated as a regular user: user.id 0002
    And the online translation service is configured and translates "Eichhörnchen" into "écureuil"
    When I GET /api/features/tasks/language/translate-suggestion/online?text=Eichhörnchen&source_language=de&target_language=fr
    Then the response status code is 200
    And the response body is:
      """
      {
        "text": "Eichhörnchen", "source_language": "de", "target_language": "fr", "source": "online",
        "suggestions": [
          { "text": "écureuil", "article": null, "context": null, "word_type": null, "source_article": null, "plural": null, "source_plural": null }
        ]
      }
      """

  Scenario: GET an online translation of a plural — the plural article is sent with the word and removed from the suggestion
    Given I am authenticated as a regular user: user.id 0002
    And the online translation service is configured and translates "les écureuils" into "die Eichhörnchen"
    When I GET /api/features/tasks/language/translate-suggestion/online?text=écureuils&source_language=fr&target_language=de&plural=true
    Then the response status code is 200
    And the response body is:
      """
      {
        "text": "écureuils", "source_language": "fr", "target_language": "de", "source": "online",
        "suggestions": [
          { "text": "Eichhörnchen", "article": null, "context": null, "word_type": null, "source_article": null, "plural": null, "source_plural": null }
        ]
      }
      """

  @error_case
  Scenario: GET an online translation when the service is not configured — 503 online_translation_unavailable
    Given I am authenticated as a regular user: user.id 0002
    And the online translation service is not configured
    When I GET /api/features/tasks/language/translate-suggestion/online?text=Eichhörnchen&source_language=de&target_language=fr
    Then the response status code is 503
    And the response body includes:
      """
      { "detail": { "code": "online_translation_unavailable" } }
      """

  @error_case
  Scenario: GET an online translation when the service fails or times out — 502 online_translation_failed
    Given I am authenticated as a regular user: user.id 0002
    And the online translation service is configured but fails
    When I GET /api/features/tasks/language/translate-suggestion/online?text=Eichhörnchen&source_language=de&target_language=fr
    Then the response status code is 502
    And the response body includes:
      """
      { "detail": { "code": "online_translation_failed" } }
      """

  @error_case
  Scenario: GET an online translation as a user with no role at all — 403
    Given the users table contains:
      | id   | email                 | status |
      | 0003 | profile_user@test.com | active |
    And I am authenticated as the person's owner: user.id 0003
    And the online translation service is configured and translates "Eichhörnchen" into "écureuil"
    When I GET /api/features/tasks/language/translate-suggestion/online?text=Eichhörnchen&source_language=de&target_language=fr
    Then the response status code is 403
