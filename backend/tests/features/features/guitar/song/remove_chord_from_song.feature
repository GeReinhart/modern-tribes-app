Feature: Remove a chord from a guitar song
  As a project manager
  I want to remove a chord from a song's progression
  So that I can fix a mistake without deleting the chord from the shared inventory

  Background:
    Given the users table contains:
      | id   | email            | status |
      | 0001 | manager@test.com | active |
      | 0002 | member@test.com  | active |
    And the roles table contains:
      | name   | status |
      | viewer | active |
    And the role_permissions table contains:
      | role   | permission                 |
      | viewer | can_access_attached_tribes |
    And the user_roles table contains:
      | user             | role   |
      | manager@test.com | viewer |
      | member@test.com  | viewer |
    And the persons table contains:
      | id   | first_name | last_name | status |
      | 0030 | Mel        | Manager   | active |
      | 0031 | Mia        | Member    | active |
    And the users table contains:
      | id   | email            | person_id | status |
      | 0001 | manager@test.com | 0030      | active |
      | 0002 | member@test.com  | 0031      | active |
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
      | 1001 | 0010     | 0030      | manager  | active |
      | 1002 | 0010     | 0031      | member   | active |
    And the projects_features table contains:
      | id   | project_id | feature_type | name    | status |
      | 0100 | 0020       | guitar_song  | Setlist | active |
    And the guitar_songs table contains:
      | id   | project_id | title      | author | tempo_bpm | beats_per_bar | status |
      | 0200 | 0020       | Wonderwall | Oasis  | 87        | 4             | active |
    And the guitar_chords table contains:
      | id   | name | root_note | frets         | status |
      | 0300 | Em7  | E         | [0,2,0,0,0,0] | active |
      | 0301 | G    | G         | [3,2,0,0,0,3] | active |
    And the guitar_songs_chords table contains:
      | id   | song_id | chord_id | position | status |
      | 0400 | 0200    | 0300     | 1        | active |
      | 0401 | 0200    | 0301     | 2        | active |

  Scenario: Manager removes a chord from the song — the link is archived, the chord itself is untouched
    Given I am authenticated as a regular user: user.id 0001
    When I DELETE /api/features/tasks/guitar-songs/song-chords/0401
    Then the response status code is 204
    And the guitar_songs_chords table contains:
      | id   | song_id | chord_id | position | status   |
      | 0400 | 0200    | 0300     | 1        | active   |
      | 0401 | 0200    | 0301     | 2        | archived |
    And the guitar_chords table contains:
      | id   | name | status |
      | 0300 | Em7  | active |
      | 0301 | G    | active |

  @error_case
  Scenario: Member (not manager) tries to remove a chord — 403 error and nothing is archived
    Given I am authenticated as a regular user: user.id 0002
    When I DELETE /api/features/tasks/guitar-songs/song-chords/0401
    Then the response status code is 403
    And the guitar_songs_chords table contains:
      | id   | song_id | chord_id | position | status |
      | 0400 | 0200    | 0300     | 1        | active |
      | 0401 | 0200    | 0301     | 2        | active |
