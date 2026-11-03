@wip
Feature: View a lesson to learn it
  As a project member
  I want to see a lesson's free-text content and its full word list with translations
  So that I can read and memorize it

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
      | de   | German  | active |
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
      | 0020       | fr               | de               | active |
    And the documents table contains:
      | id   | content_html                    | status |
      | 0500 | Les bases de la vie quotidienne | active |
    And the language_lessons table contains:
      | id   | project_id | title                 | document_id | status |
      | 1500 | 0020       | Chapter 1 - Greetings | 0500        | active |
    And the language_words table contains:
      | id   | text   | language | word_type | article | plural | status |
      | 2001 | homme  | fr       | noun      | le      | hommes | active |
      | 2002 | Mann   | de       | noun      | der     | Männer | active |
    And the language_word_declensions table contains:
      | id   | word_id | case_label | form      | position | status |
      | 3001 | 2002    | Akkusativ  | den Mann  | 1        | active |
      | 3002 | 2002    | Dativ      | dem Mann  | 2        | active |
    And the language_word_translations table contains:
      | id   | word_id_a | word_id_b | status |
      | 4001 | 2001      | 2002      | active |
    And the language_lesson_words table contains:
      | id   | lesson_id | word_id | position | status |
      | 5001 | 1500      | 2001    | 1        | active |

  Scenario: GET a lesson to learn it — the document and the full word list (with translations and declensions) are returned
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I GET /api/features/tasks/language/lessons/1500/learn
    Then the response status code is 200
    And the response body is:
      """
      {
        "id": "1500",
        "title": "Chapter 1 - Greetings",
        "document": { "id": "0500", "content": "Les bases de la vie quotidienne" },
        "words": [
          {
            "id": "2001",
            "text": "homme",
            "language": "fr",
            "word_type": "noun",
            "article": "le",
            "plural": "hommes",
            "declensions": [],
            "translations": [
              {
                "id": "2002",
                "text": "Mann",
                "language": "de",
                "word_type": "noun",
                "article": "der",
                "plural": "Männer",
                "declensions": [
                  { "case_label": "Akkusativ", "form": "den Mann" },
                  { "case_label": "Dativ", "form": "dem Mann" }
                ]
              }
            ]
          }
        ]
      }
      """

  @error_case
  Scenario: GET a lesson as a user without access to the project's tribe — 403
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
    When I GET /api/features/tasks/language/lessons/1500/learn
    Then the response status code is 403
