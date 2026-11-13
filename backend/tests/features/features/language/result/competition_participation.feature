@wip
Feature: Join or leave a project's competition
  As a project member
  I want to choose whether I appear in the Competition results
  So that I decide whether the other members can see my score

  The choice is stored per user and per language project, so it covers all of the project's
  lessons. A user who never chose takes part. Leaving only hides the user from the others: they
  still see the competition.

  Background:
    Given today is 2026-11-16
    And the users table contains:
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

  Scenario: GET the participation — a user who never chose takes part
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the language_competition_participation table contains:
      | project_id | user_id | participates |
    When I GET /api/features/tasks/language/lessons/1500/result/competition/participation
    Then the response status code is 200
    And the response body includes:
      """
      { "participates": true }
      """
    And the language_competition_participation table contains:
      | project_id | user_id | participates |

  Scenario: PUT the participation to false — the user leaves the competition
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the language_competition_participation table contains:
      | project_id | user_id | participates |
    When I PUT /api/features/tasks/language/lessons/1500/result/competition/participation with body:
      """
      { "participates": false }
      """
    Then the response status code is 200
    And the response body includes:
      """
      { "participates": false }
      """
    And the language_competition_participation table contains:
      | project_id | user_id | participates |
      | 0020       | 0002    | false        |

  Scenario: PUT the participation to true — the user joins again, without a duplicate row
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the language_competition_participation table contains:
      | project_id | user_id | participates |
      | 0020       | 0002    | false        |
    When I PUT /api/features/tasks/language/lessons/1500/result/competition/participation with body:
      """
      { "participates": true }
      """
    Then the response status code is 200
    And the language_competition_participation table contains:
      | project_id | user_id | participates |
      | 0020       | 0002    | true         |

  Scenario: PUT the participation — another member's choice is left untouched
    Given I am authenticated as a regular user: user.id 0002
    And the persons table contains:
      | id   | first_name | last_name | status |
      | 0031 | Leo        | Learner   | active |
    And the users table contains:
      | id   | email        | person_id | status |
      | 0003 | leo@test.com | 0031      | active |
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the language_competition_participation table contains:
      | project_id | user_id | participates |
      | 0020       | 0003    | false        |
    When I PUT /api/features/tasks/language/lessons/1500/result/competition/participation with body:
      """
      { "participates": false }
      """
    Then the response status code is 200
    And the language_competition_participation table contains:
      | project_id | user_id | participates |
      | 0020       | 0002    | false        |
      | 0020       | 0003    | false        |

  @error_case
  Scenario: GET and PUT the participation as a user without access to the project's tribe — 403
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id | tribe_id | person_id | position | status |
    When I GET /api/features/tasks/language/lessons/1500/result/competition/participation
    Then the response status code is 403

  @error_case
  Scenario: PUT the participation without a boolean value — 422
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I PUT /api/features/tasks/language/lessons/1500/result/competition/participation with body:
      """
      { "participates": "maybe" }
      """
    Then the response status code is 422
