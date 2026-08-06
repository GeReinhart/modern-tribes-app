Feature: Duplicate a section
  As a project member
  I want to copy a section's chord structure into a new section
  So that I can reuse a verse's chord pattern for another verse without retyping every chord

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
    And the guitar_songs table contains:
      | id   | project_id | title      | author | status |
      | 0200 | 0020       | Wonderwall | Oasis  | active |
    And the guitar_chords table contains:
      | id   | name | root_note | frets         | status |
      | 0300 | Em7  | E         | [0,2,0,0,0,0] | active |
      | 0301 | G    | G         | [3,2,0,0,0,3] | active |
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |

  Scenario: POST duplicate on a lyrics-mode section — a new section is appended with the same lyrics and word-chord attachments
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_sections table contains:
      | id   | song_id | position | type_label | content_mode | lyrics_text     | status |
      | 0500 | 0200    | 1        | Couplet    | lyrics       | Twinkle little  | active |
    And the guitar_songs_section_words table contains:
      | id   | section_id | line_index | word_index | word_text | status |
      | 0600 | 0500       | 0          | 0          | Twinkle   | active |
      | 0601 | 0500       | 0          | 1          | little    | active |
    And the guitar_songs_section_word_chords table contains:
      | word_id | position | chord_id |
      | 0600    | start    | 0300     |
    When I POST /api/features/tasks/guitar-songs/sections/0500/duplicate with body:
      """
      {}
      """
    Then the response status code is 201
    And the guitar_songs_sections table contains:
      | song_id | position | type_label | content_mode | lyrics_text    | status |
      | 0200    | 1        | Couplet    | lyrics       | Twinkle little | active |
      | 0200    | 2        | Couplet    | lyrics       | Twinkle little | active |
    And the guitar_songs_section_words table contains:
      | line_index | word_index | word_text | status |
      | 0          | 0          | Twinkle   | active |
      | 0          | 1          | little    | active |
      | 0          | 0          | Twinkle   | active |
      | 0          | 1          | little    | active |
    And the guitar_songs_section_word_chords table contains:
      | position | chord_id |
      | start    | 0300     |
      | start    | 0300     |

  Scenario: POST duplicate on a chords-only section — a new section is appended with the same chord sequence
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_sections table contains:
      | id   | song_id | position | type_label | content_mode | status |
      | 0510 | 0200    | 1        | Intro      | chords_only  | active |
    And the guitar_songs_section_chords table contains:
      | id   | section_id | chord_id | position | status |
      | 0800 | 0510       | 0300     | 1        | active |
      | 0801 | 0510       | 0301     | 2        | active |
    When I POST /api/features/tasks/guitar-songs/sections/0510/duplicate with body:
      """
      {}
      """
    Then the response status code is 201
    And the guitar_songs_sections table contains:
      | song_id | position | type_label | content_mode | status |
      | 0200    | 1        | Intro      | chords_only  | active |
      | 0200    | 2        | Intro      | chords_only  | active |
