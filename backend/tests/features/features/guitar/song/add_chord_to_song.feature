Feature: Add a chord to a guitar song
  As a project member
  I want to attach a chord from the shared inventory to a song, in order, with an optional comment
  So that the song shows exactly how to play it

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
    And the guitar_songs table contains:
      | id   | project_id | title      | author | tempo_bpm | beats_per_bar | status |
      | 0200 | 0020       | Wonderwall | Oasis  | 87        | 4             | active |
    And the guitar_chords table contains:
      | id   | name | root_note | frets           | status |
      | 0300 | Em7  | E         | [0,2,0,0,0,0]   | active |
      | 0301 | G    | G         | [3,2,0,0,0,3]   | active |

  Scenario: POST a chord onto a song as a member — the chord is linked at the next position
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_chords table contains:
      | id | song_id | chord_id | position | comment | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/chords with body:
      """
      {"chord_id": "0300", "comment": "capo 2 for this one"}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "chord_id": "0300",
        "position": 1,
        "comment": "capo 2 for this one",
        "status": "active"
      }
      """
    And the guitar_songs_chords table contains:
      | song_id | chord_id | position | comment             | status |
      | 0200    | 0300     | 1        | capo 2 for this one | active |

  Scenario: POST a second chord onto the same song — it is linked at the next position after the first
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_chords table contains:
      | id   | song_id | chord_id | position | status |
      | 0400 | 0200    | 0300     | 1        | active |
    When I POST /api/features/tasks/guitar-songs/songs/0200/chords with body:
      """
      {"chord_id": "0301"}
      """
    Then the response status code is 201
    And the guitar_songs_chords table contains:
      | song_id | chord_id | position | status |
      | 0200    | 0300     | 1        | active |
      | 0200    | 0301     | 2        | active |

  @error_case
  Scenario: POST the same chord onto the same song twice — 409 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_chords table contains:
      | id   | song_id | chord_id | position | status |
      | 0400 | 0200    | 0300     | 1        | active |
    When I POST /api/features/tasks/guitar-songs/songs/0200/chords with body:
      """
      {"chord_id": "0300"}
      """
    Then the response status code is 409
    And the guitar_songs_chords table contains:
      | id   | song_id | chord_id | position | status |
      | 0400 | 0200    | 0300     | 1        | active |

  @error_case
  Scenario: POST a chord onto a song as a guest — 403 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0003
    And the guitar_songs_chords table contains:
      | id | song_id | chord_id | position | comment | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/chords with body:
      """
      {"chord_id": "0301"}
      """
    Then the response status code is 403
    And the guitar_songs_chords table contains:
      | id | song_id | chord_id | position | comment | status |
