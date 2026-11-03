@wip
Feature: Remove a word from a lesson
  As a project member
  I want to detach a word from a lesson
  So that the lesson only lists the words I want to study, without deleting the word from the shared dictionary

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
    And the language_lessons table contains:
      | id   | project_id | title                 | document_id | status |
      | 1500 | 0020       | Chapter 1 - Greetings | 0500        | active |
    And the language_words table contains:
      | id   | text  | language | word_type | article | plural  | status |
      | 2001 | chien | fr       | noun      | le      | chiens  | active |
      | 2002 | chat  | fr       | noun      | le      | chats   | active |

  Scenario: DELETE a word from a lesson — it is detached from the lesson only, the word itself stays in the dictionary
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the language_lesson_words table contains:
      | lesson_id | word_id | status |
      | 1500      | 2001    | active |
      | 1500      | 2002    | active |
    When I DELETE /api/features/tasks/language/lessons/1500/words/2001
    Then the response status code is 204
    And the language_lesson_words table contains:
      | lesson_id | word_id | status   |
      | 1500      | 2001    | archived |
      | 1500      | 2002    | active   |
    And the language_words table contains:
      | id   | text  | language | word_type | status |
      | 2001 | chien | fr       | noun      | active |
      | 2002 | chat  | fr       | noun      | active |

  Scenario: DELETE a word that is not in the lesson — 404 and the lesson's word list is unchanged
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the language_lesson_words table contains:
      | lesson_id | word_id | status |
      | 1500      | 2002    | active |
    When I DELETE /api/features/tasks/language/lessons/1500/words/2001
    Then the response status code is 404
    And the language_lesson_words table contains:
      | lesson_id | word_id | status |
      | 1500      | 2002    | active |

  @error_case
  Scenario: DELETE a word from a lesson as a user without access to the project's tribe — 403 and nothing is removed
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
    And the language_lesson_words table contains:
      | lesson_id | word_id | status |
      | 1500      | 2001    | active |
    When I DELETE /api/features/tasks/language/lessons/1500/words/2001
    Then the response status code is 403
    And the language_lesson_words table contains:
      | lesson_id | word_id | status |
      | 1500      | 2001    | active |
