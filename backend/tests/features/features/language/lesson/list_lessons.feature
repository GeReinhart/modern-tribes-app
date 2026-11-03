@wip
Feature: List a project's lessons
  As a project member
  I want to see every lesson in the project's shared language knowledge base
  So that I can open one to edit, learn or test it

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
      | 0501 | active |

  Scenario: GET a project's lessons — every lesson is listed with its word count
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the language_lessons table contains:
      | id   | project_id | title                 | document_id | status |
      | 1500 | 0020       | Chapter 1 - Greetings | 0500        | active |
      | 1501 | 0020       | Chapter 2 - Food      | 0501        | active |
    And the language_words table contains:
      | id   | text | language | word_type | status |
      | 2001 | chat | fr       | noun      | active |
    And the language_lesson_words table contains:
      | lesson_id | word_id | status |
      | 1500      | 2001    | active |
    When I GET /api/features/tasks/language/projects/0020/lessons
    Then the response status code is 200
    And the response body includes:
      """
      [
        { "id": "1500", "title": "Chapter 1 - Greetings", "word_count": 1 },
        { "id": "1501", "title": "Chapter 2 - Food", "word_count": 0 }
      ]
      """

  @error_case
  Scenario: GET a project's lessons as a user without access to the project's tribe — 403
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id | tribe_id | person_id | position | status |
    When I GET /api/features/tasks/language/projects/0020/lessons
    Then the response status code is 403
