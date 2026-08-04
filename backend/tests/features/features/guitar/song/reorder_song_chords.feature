Feature: Reorder chords within a guitar song
  As a project manager
  I want to move a chord up or down in the song's chord progression
  So that the sequence matches how the song is actually played

  Background:
    Given the users table contains:
      | id   | email          | status |
      | 0001 | admin@test.com | active |
      | 0002 | user@test.com  | active |
    And the roles table contains:
      | name          | status |
      | administrator | active |
      | viewer        | active |
    And the role_permissions table contains:
      | role          | permission                 |
      | administrator | admin                      |
      | viewer        | can_access_attached_tribes |
    And the user_roles table contains:
      | user           | role          |
      | admin@test.com | administrator |
      | user@test.com  | viewer        |
    And the projects table contains:
      | id   | name      | status |
      | 0020 | Rehearsal | active |
    And the projects_features table contains:
      | id   | project_id | feature_type | name    | status |
      | 0100 | 0020       | guitar_song  | Setlist | active |
    And the guitar_songs table contains:
      | id   | project_id | title      | author | tempo_bpm | beats_per_bar | status |
      | 0200 | 0020       | Wonderwall | Oasis  | 87        | 4             | active |
    And the guitar_chords table contains:
      | id   | name | root_note | frets             | status |
      | 0300 | Em7  | E         | [0,2,0,0,0,0]     | active |
      | 0301 | G    | G         | [3,2,0,0,0,3]     | active |
      | 0302 | D    | D         | ["X","X",0,2,3,2] | active |
    And the guitar_songs_chords table contains:
      | id   | song_id | chord_id | position | status |
      | 0400 | 0200    | 0300     | 1        | active |
      | 0401 | 0200    | 0301     | 2        | active |
      | 0402 | 0200    | 0302     | 3        | active |

  Scenario: Manager moves the second chord up — it swaps position with the first
    Given I am authenticated as an administrator: user.id 0001
    When I POST /api/features/tasks/guitar-songs/song-chords/0401/move with body:
      """
      {"direction": "prev"}
      """
    Then the response status code is 200
    And the guitar_songs_chords table contains:
      | id   | song_id | chord_id | position | status |
      | 0400 | 0200    | 0300     | 2        | active |
      | 0401 | 0200    | 0301     | 1        | active |
      | 0402 | 0200    | 0302     | 3        | active |

  Scenario: Manager moves the second chord down — it swaps position with the third
    Given I am authenticated as an administrator: user.id 0001
    When I POST /api/features/tasks/guitar-songs/song-chords/0401/move with body:
      """
      {"direction": "next"}
      """
    Then the response status code is 200
    And the guitar_songs_chords table contains:
      | id   | song_id | chord_id | position | status |
      | 0400 | 0200    | 0300     | 1        | active |
      | 0401 | 0200    | 0301     | 3        | active |
      | 0402 | 0200    | 0302     | 2        | active |

  Scenario: Manager moves the first chord up — no-op, order is unchanged
    Given I am authenticated as an administrator: user.id 0001
    When I POST /api/features/tasks/guitar-songs/song-chords/0400/move with body:
      """
      {"direction": "prev"}
      """
    Then the response status code is 200
    And the guitar_songs_chords table contains:
      | id   | song_id | chord_id | position | status |
      | 0400 | 0200    | 0300     | 1        | active |
      | 0401 | 0200    | 0301     | 2        | active |
      | 0402 | 0200    | 0302     | 3        | active |

  @error_case
  Scenario: Member (not manager) tries to reorder — 403 error and the order is unchanged
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
    And the tribes_projects table contains:
      | tribe_id | project_id | relation |
      | 0010     | 0020       | manager  |
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I POST /api/features/tasks/guitar-songs/song-chords/0401/move with body:
      """
      {"direction": "prev"}
      """
    Then the response status code is 403
    And the guitar_songs_chords table contains:
      | id   | song_id | chord_id | position | status |
      | 0400 | 0200    | 0300     | 1        | active |
      | 0401 | 0200    | 0301     | 2        | active |
      | 0402 | 0200    | 0302     | 3        | active |
