@wip
Feature: Create a language lesson
  As a project member
  I want to create a new lesson in the project's language knowledge base
  So that I can start adding vocabulary and free-text content to it

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

  Scenario: POST a lesson in a project with a language pair already set — the lesson is created with an empty document
    Given I am authenticated as a regular user: user.id 0002
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
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the language_settings table contains:
      | project_id | source_language | target_language | status |
      | 0020       | fr               | en               | active |
    And the documents table contains:
      | id | status |
    And the language_lessons table contains:
      | id | project_id | title | document_id | status |
    When I POST /api/features/tasks/language/projects/0020/lessons with body:
      """
      { "title": "Chapter 1 - Greetings" }
      """
    Then the response status code is 201
    And the response body includes:
      """
      { "project_id": "0020", "title": "Chapter 1 - Greetings", "word_count": 0 }
      """
    And the language_lessons table contains:
      | project_id | title                    | status |
      | 0020       | Chapter 1 - Greetings    | active |

  Scenario: POST a lesson in a project with no language pair set yet — 422 and no lesson is created
    Given I am authenticated as a regular user: user.id 0002
    And the persons table contains:
      | id   | first_name | last_name | status |
      | 0030 | Mia        | Member    | active |
    And the users table contains:
      | id   | email         | person_id | status |
      | 0002 | user@test.com | 0030      | active |
    And the tribes table contains:
      | id   | name | status |
      | 0010 | Band | active |
    And the projects table contains:
      | id   | name       | status |
      | 0020 | Vocabulary | active |
    And the tribes_projects table contains:
      | tribe_id | project_id | relation |
      | 0010     | 0020       | manager  |
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the language_settings table contains:
      | project_id | source_language | target_language | status |
    And the language_lessons table contains:
      | id | project_id | title | document_id | status |
    When I POST /api/features/tasks/language/projects/0020/lessons with body:
      """
      { "title": "Chapter 1 - Greetings" }
      """
    Then the response status code is 422
    And the language_lessons table contains:
      | id | project_id | title | document_id | status |

  @error_case
  Scenario: POST a lesson as a user without access to the project's tribe — 403 and no lesson is created
    Given I am authenticated as a regular user: user.id 0002
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
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
    And the language_settings table contains:
      | project_id | source_language | target_language | status |
      | 0020       | fr               | en               | active |
    And the language_lessons table contains:
      | id | project_id | title | document_id | status |
    When I POST /api/features/tasks/language/projects/0020/lessons with body:
      """
      { "title": "Chapter 1 - Greetings" }
      """
    Then the response status code is 403
    And the language_lessons table contains:
      | id | project_id | title | document_id | status |
