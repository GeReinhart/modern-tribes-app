Feature: Duplicate a whole song
  As a project member
  I want to copy an entire song into a new one
  So that I can build a setlist variant without rebuilding everything from scratch

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
    And the guitar_songs table contains:
      | id   | project_id | title      | author | tempo_bpm | beats_per_bar | capo | status |
      | 0200 | 0020       | Wonderwall | Oasis  | 87        | 4             | 2    | active |
    And the guitar_chords table contains:
      | id   | name | root_note | frets         | status |
      | 0300 | Em7  | E         | [0,2,0,0,0,0] | active |
    And the guitar_songs_chords table contains:
      | id   | song_id | chord_id | position | comment      | status |
      | 0700 | 0200    | 0300     | 1        | Play softly  | active |
    And the guitar_songs_videos table contains:
      | id   | song_id | title       | url                             | position | status |
      | 0710 | 0200    | Live at BBC | https://example.com/video.mp4  | 1        | active |
    And the guitar_songs_sections table contains:
      | id   | song_id | position | type_label | content_mode | lyrics_text | status |
      | 0720 | 0200    | 1        | Couplet    | lyrics       | Twinkle     | active |
    And the guitar_songs_layout_settings table contains:
      | id   | song_id | status |
      | 0730 | 0200    | active |
    And the guitar_songs_layout_rows table contains:
      | id   | song_id | position | page_break_before | status |
      | 0740 | 0200    | 1        | false              | active |
    And the guitar_songs_layout_columns table contains:
      | id   | row_id | song_id | position | width_eighths | align | status |
      | 0750 | 0740   | 0200    | 1        | 8              | left  | active |
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | status |
      | 0760 | 0750      | 0200    | 1        | title      | active |

  Scenario: POST duplicate on a song — a new song is created with the same content, titled "<title> - COPIE"
    Given I am authenticated as a regular user: user.id 0002
    When I POST /api/features/tasks/guitar-songs/songs/0200/duplicate
    Then the response status code is 201
    And the guitar_songs table contains:
      | project_id | title                 | author | tempo_bpm | beats_per_bar | capo | status |
      | 0020       | Wonderwall            | Oasis  | 87        | 4             | 2    | active |
      | 0020       | Wonderwall - COPIE    | Oasis  | 87        | 4             | 2    | active |
    And the guitar_songs_chords table contains:
      | chord_id | position | comment      | status |
      | 0300     | 1        | Play softly  | active |
      | 0300     | 1        | Play softly  | active |
    And the guitar_songs_videos table contains:
      | title       | url                             | position | status |
      | Live at BBC | https://example.com/video.mp4  | 1        | active |
      | Live at BBC | https://example.com/video.mp4  | 1        | active |
    And the guitar_songs_sections table contains:
      | position | type_label | content_mode | lyrics_text | status |
      | 1        | Couplet    | lyrics       | Twinkle     | active |
      | 1        | Couplet    | lyrics       | Twinkle     | active |
    And the guitar_songs_layout_rows table contains:
      | position | page_break_before | status |
      | 1        | false              | active |
      | 1        | false              | active |
    And the guitar_songs_layout_column_blocks table contains:
      | block_type | status |
      | title      | active |
      | title      | active |

  @error_case
  Scenario: POST duplicate as a project outsider — 403 and no song is created
    Given I am authenticated as a regular user: user.id 0002
    And the projects table contains:
      | id   | name    | status |
      | 0021 | Private | active |
    And the guitar_songs table contains:
      | id   | project_id | title | status |
      | 0201 | 0021       | Solo  | active |
    When I POST /api/features/tasks/guitar-songs/songs/0201/duplicate
    Then the response status code is 403
