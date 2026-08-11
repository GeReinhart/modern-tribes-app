Feature: Add a chord to the guitar chords inventory
  As a signed-in user
  I want to add a chord shape to the shared guitar chords inventory
  So that anyone using the app can look it up and play it correctly

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
      | user@test.com  | viewer |

  Scenario: POST /guitar/chords/ with a valid shape — the chord is created and the root note is proposed from the name
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_chords table contains:
      | id | name | root_note | description | frets | status |
    When I POST /api/features/tasks/guitar-chords/ with body:
      """
      {"name": "Cmaj7", "frets": [0, 3, 2, 0, 0, 0]}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "name": "Cmaj7",
        "root_note": "C",
        "description": null,
        "frets": [0, 3, 2, 0, 0, 0],
        "status": "active"
      }
      """
    And the guitar_chords table contains:
      | name  | root_note | description | frets              | status |
      | Cmaj7 | C         |              | [0, 3, 2, 0, 0, 0] | active |

  Scenario: POST /guitar/chords/ with an explicit root_note — the proposed root is overridden
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_chords table contains:
      | id | name | root_note | description | frets | status |
    When I POST /api/features/tasks/guitar-chords/ with body:
      """
      {"name": "Cmaj7", "root_note": "E", "frets": [0, 3, 2, 0, 0, 0]}
      """
    Then the response status code is 201
    And the guitar_chords table contains:
      | name  | root_note | frets              | status |
      | Cmaj7 | E         | [0, 3, 2, 0, 0, 0] | active |

  Scenario: POST /guitar/chords/ with a muted string — "X" is accepted alongside fret numbers
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_chords table contains:
      | id | name | root_note | description | frets | status |
    When I POST /api/features/tasks/guitar-chords/ with body:
      """
      {"name": "Am", "frets": ["X", 0, 2, 2, 1, 0]}
      """
    Then the response status code is 201
    And the guitar_chords table contains:
      | name | root_note | frets                 | status |
      | Am   | A         | ["X", 0, 2, 2, 1, 0]  | active |

  @error_case
  Scenario: POST /guitar/chords/ with a fret out of range — 422 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_chords table contains:
      | id | name | root_note | description | frets | status |
    When I POST /api/features/tasks/guitar-chords/ with body:
      """
      {"name": "Weird", "frets": [0, 0, 0, 0, 0, 21]}
      """
    Then the response status code is 422
    And the guitar_chords table contains:
      | id | name | root_note | description | frets | status |

  @error_case
  Scenario: POST /guitar/chords/ with fewer than 6 strings — 422 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_chords table contains:
      | id | name | root_note | description | frets | status |
    When I POST /api/features/tasks/guitar-chords/ with body:
      """
      {"name": "Incomplete", "frets": [0, 2, 2, 1, 0]}
      """
    Then the response status code is 422
    And the guitar_chords table contains:
      | id | name | root_note | description | frets | status |

  Scenario: POST /guitar/chords/ with a difficulty level — it is stored
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_chords table contains:
      | id | name | root_note | description | frets | difficulty | status |
    When I POST /api/features/tasks/guitar-chords/ with body:
      """
      {"name": "Fmaj7#11", "frets": ["X", 0, 3, 2, 1, 0], "difficulty": 5}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {"name": "Fmaj7#11", "difficulty": 5}
      """
    And the guitar_chords table contains:
      | name       | difficulty | status |
      | Fmaj7#11   | 5          | active |

  @error_case
  Scenario: POST /guitar/chords/ with a difficulty out of range — 422 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_chords table contains:
      | id | name | root_note | description | frets | difficulty | status |
    When I POST /api/features/tasks/guitar-chords/ with body:
      """
      {"name": "Weird", "frets": [0, 0, 0, 0, 0, 0], "difficulty": 6}
      """
    Then the response status code is 422
    And the guitar_chords table contains:
      | id | name | root_note | description | frets | difficulty | status |
