@wip
Feature: Update a lesson's title and content
  As a project member
  I want to rename a lesson and edit its free-text content
  So that I can keep writing and refining the lesson over time

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
      | id   | content_html         | status |
      | 0500 | Les salutations      | active |
    And the language_lessons table contains:
      | id   | project_id | title                 | document_id | status |
      | 1500 | 0020       | Chapter 1 - Greetings | 0500        | active |

  Scenario: PATCH a lesson's title — it is renamed
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I PATCH /api/features/tasks/language/lessons/1500 with body:
      """
      { "title": "Chapter 1 - Hello and goodbye" }
      """
    Then the response status code is 200
    And the response body includes:
      """
      { "id": "1500", "title": "Chapter 1 - Hello and goodbye" }
      """
    And the language_lessons table contains:
      | id   | project_id | title                        | document_id | status |
      | 1500 | 0020       | Chapter 1 - Hello and goodbye | 0500        | active |

  Scenario: PATCH a lesson's document content — the document is updated and the previous content becomes a revision
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I PATCH /api/features/tasks/language/lessons/1500 with body:
      """
      { "document_content_html": "Les salutations et les adieux" }
      """
    Then the response status code is 200
    When I GET /api/features/tasks/language/lessons/1500/learn
    Then the response status code is 200
    And the response body includes:
      """
      { "document": { "id": "0500", "content": "Les salutations et les adieux" } }
      """
    When I GET /api/features/tasks/language/lessons/1500/document/revisions
    Then the response status code is 200
    And the response body includes:
      """
      [
        { "content_html": "Les salutations et les adieux", "is_current": true },
        { "content_html": "Les salutations", "is_current": false }
      ]
      """

  Scenario: PATCH an unknown lesson — 404
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I PATCH /api/features/tasks/language/lessons/9999 with body:
      """
      { "title": "Nope" }
      """
    Then the response status code is 404

  @error_case
  Scenario: PATCH a lesson as a user without access to the project's tribe — 403 and the lesson is unchanged
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id | tribe_id | person_id | position | status |
    When I PATCH /api/features/tasks/language/lessons/1500 with body:
      """
      { "title": "Hacked title" }
      """
    Then the response status code is 403
    And the language_lessons table contains:
      | id   | project_id | title                 | document_id | status |
      | 1500 | 0020       | Chapter 1 - Greetings | 0500        | active |
