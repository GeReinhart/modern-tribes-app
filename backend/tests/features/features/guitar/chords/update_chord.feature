Feature: Update a chord in the shared guitar chords inventory
  As a signed-in user
  I want to set a chord's difficulty level
  So that songs using it can show how hard it is to play

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

  Scenario: PATCH a chord's difficulty — it is updated
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_chords table contains:
      | id   | name  | root_note | frets              | difficulty | status |
      | 0700 | Cmaj7 | C         | [0, 3, 2, 0, 0, 0] |            | active |
    When I PATCH /api/features/tasks/guitar-chords/0700 with body:
      """
      {"difficulty": 2}
      """
    Then the response status code is 200
    And the guitar_chords table contains:
      | id   | name  | root_note | frets              | difficulty | status |
      | 0700 | Cmaj7 | C         | [0, 3, 2, 0, 0, 0] | 2          | active |

  @error_case
  Scenario: PATCH a chord's difficulty out of range — 422 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_chords table contains:
      | id   | name  | root_note | frets              | difficulty | status |
      | 0700 | Cmaj7 | C         | [0, 3, 2, 0, 0, 0] |            | active |
    When I PATCH /api/features/tasks/guitar-chords/0700 with body:
      """
      {"difficulty": -1}
      """
    Then the response status code is 422
    And the guitar_chords table contains:
      | id   | name  | root_note | frets              | difficulty | status |
      | 0700 | Cmaj7 | C         | [0, 3, 2, 0, 0, 0] |            | active |
