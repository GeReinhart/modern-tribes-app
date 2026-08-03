Feature: Create a guitar song
  As a project member
  I want to add a new song to the guitar_song tab's shared songbook
  So that the whole tribe can practice it together with the right tempo

  Background:
    Given the users table contains:
      | id   | email           | status |
      | 0002 | member@test.com | active |
      | 0003 | guest@test.com  | active |
    And the roles table contains:
      | name   | status |
      | viewer | active |
    And the role_permissions table contains:
      | role   | permission                 |
      | viewer | can_access_attached_tribes |
    And the user_roles table contains:
      | user            | role   |
      | member@test.com | viewer |
      | guest@test.com  | viewer |
    And the persons table contains:
      | id   | first_name | last_name | status |
      | 0030 | Mia        | Member    | active |
      | 0031 | Gus        | Guest     | active |
    And the users table contains:
      | id   | email           | person_id | status |
      | 0002 | member@test.com | 0030      | active |
      | 0003 | guest@test.com  | 0031      | active |
    And the tribes table contains:
      | id   | name | status |
      | 0010 | Band | active |
    And the projects table contains:
      | id   | name      | status |
      | 0020 | Rehearsal | active |
    And the tribes_projects table contains:
      | tribe_id | project_id | relation |
      | 0010     | 0020       | manager  |
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
      | 1002 | 0010     | 0031      | guest    | active |
    And the projects_features table contains:
      | id   | project_id | feature_type | name    | status |
      | 0100 | 0020       | guitar_song  | Setlist | active |

  Scenario: POST a song as a project member — the song is created with defaults
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs table contains:
      | id | project_id | title | author | tempo_bpm | beats_per_bar | status |
    When I POST /api/features/tasks/guitar-songs/instances/0100/songs with body:
      """
      {"title": "Wonderwall", "author": "Oasis", "tempo_bpm": 87, "beats_per_bar": 4}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "title": "Wonderwall",
        "author": "Oasis",
        "tempo_bpm": 87,
        "beats_per_bar": 4,
        "status": "active"
      }
      """
    And the guitar_songs table contains:
      | project_id | title      | author | tempo_bpm | beats_per_bar | status |
      | 0020       | Wonderwall | Oasis  | 87        | 4             | active |

  @error_case
  Scenario: POST a song as a guest — 403 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0003
    And the guitar_songs table contains:
      | id | project_id | title | author | tempo_bpm | beats_per_bar | status |
    When I POST /api/features/tasks/guitar-songs/instances/0100/songs with body:
      """
      {"title": "Wonderwall", "author": "Oasis", "tempo_bpm": 87, "beats_per_bar": 4}
      """
    Then the response status code is 403
    And the guitar_songs table contains:
      | id | project_id | title | author | tempo_bpm | beats_per_bar | status |

  @error_case
  Scenario: POST a song with a tempo out of range — 422 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs table contains:
      | id | project_id | title | author | tempo_bpm | beats_per_bar | status |
    When I POST /api/features/tasks/guitar-songs/instances/0100/songs with body:
      """
      {"title": "Too Fast", "author": "Nobody", "tempo_bpm": 500, "beats_per_bar": 4}
      """
    Then the response status code is 422
    And the guitar_songs table contains:
      | id | project_id | title | author | tempo_bpm | beats_per_bar | status |

  @error_case
  Scenario: POST a song with a beats_per_bar out of range — 422 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs table contains:
      | id | project_id | title | author | tempo_bpm | beats_per_bar | status |
    When I POST /api/features/tasks/guitar-songs/instances/0100/songs with body:
      """
      {"title": "Odd Meter", "author": "Nobody", "tempo_bpm": 100, "beats_per_bar": 12}
      """
    Then the response status code is 422
    And the guitar_songs table contains:
      | id | project_id | title | author | tempo_bpm | beats_per_bar | status |
