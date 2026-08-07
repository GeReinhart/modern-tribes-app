Feature: Add a structural section to a guitar song
  As a project member
  I want to add sections like Intro, Couplet or Refrain to a song
  So that I can organize its lyrics and chords the way the song is actually structured

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
    And the guitar_songs table contains:
      | id   | project_id | title      | author | status |
      | 0200 | 0020       | Wonderwall | Oasis  | active |

  Scenario: POST the first section of a type onto a song — the display label carries no number
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_sections table contains:
      | id | song_id | position | type_label | content_mode | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/sections with body:
      """
      {"type_label": "Intro", "content_mode": "chords_only"}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "type_label": "Intro",
        "custom_label": null,
        "display_label": "Intro",
        "content_mode": "chords_only",
        "position": 1
      }
      """
    And the guitar_songs_sections table contains:
      | song_id | position | type_label | custom_label | content_mode | status |
      | 0200    | 1        | Intro      |              | chords_only  | active |

  Scenario: POST a section sharing its type with an existing section — both get numbered
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_sections table contains:
      | id   | song_id | position | type_label | content_mode | status |
      | 0500 | 0200    | 1        | Couplet    | lyrics       | active |
    When I POST /api/features/tasks/guitar-songs/songs/0200/sections with body:
      """
      {"type_label": "Couplet", "content_mode": "lyrics"}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {"type_label": "Couplet", "display_label": "Couplet 2", "position": 2}
      """
    And the guitar_songs_sections table contains:
      | song_id | position | type_label | content_mode | status |
      | 0200    | 1        | Couplet    | lyrics       | active |
      | 0200    | 2        | Couplet    | lyrics       | active |

  Scenario: POST a section with a layout_block_id pointing at a Lyrics & Chords block — it's assigned to that block
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_layout_rows table contains:
      | id   | song_id | position | page_break_before | status |
      | 0700 | 0200    | 1        | false              | active |
    And the guitar_songs_layout_columns table contains:
      | id   | row_id | song_id | position | width_eighths | align | status |
      | 0710 | 0700   | 0200    | 1        | 8              | left  | active |
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | status |
      | 0711 | 0710      | 0200    | 1        | sections   | active |
    And the guitar_songs_sections table contains:
      | id | song_id | position | type_label | content_mode | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/sections with body:
      """
      {"type_label": "Intro", "content_mode": "chords_only", "layout_block_id": "0711"}
      """
    Then the response status code is 201
    And the guitar_songs_sections table contains:
      | song_id | position | type_label | layout_block_id | status |
      | 0200    | 1        | Intro      | 0711             | active |

  @error_case
  Scenario: POST a section with a layout_block_id that isn't a Lyrics & Chords block — 422 and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_layout_rows table contains:
      | id   | song_id | position | page_break_before | status |
      | 0700 | 0200    | 1        | false              | active |
    And the guitar_songs_layout_columns table contains:
      | id   | row_id | song_id | position | width_eighths | align | status |
      | 0710 | 0700   | 0200    | 1        | 8              | left  | active |
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | status |
      | 0712 | 0710      | 0200    | 1        | title      | active |
    And the guitar_songs_sections table contains:
      | id | song_id | position | type_label | content_mode | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/sections with body:
      """
      {"type_label": "Intro", "content_mode": "chords_only", "layout_block_id": "0712"}
      """
    Then the response status code is 422
    And the guitar_songs_sections table contains:
      | id | song_id | position | type_label | content_mode | status |

  Scenario: POST a section linked to another — its content resolves from the linked section
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_sections table contains:
      | id   | song_id | position | type_label | content_mode | lyrics_text | status |
      | 0500 | 0200    | 1        | Refrain    | lyrics       | Shine on    | active |
    And the guitar_songs_section_words table contains:
      | id   | section_id | line_index | word_index | word_text | status |
      | 0600 | 0500       | 0          | 0          | Shine     | active |
      | 0601 | 0500       | 0          | 1          | on        | active |
    When I POST /api/features/tasks/guitar-songs/songs/0200/sections with body:
      """
      {"type_label": "Refrain", "content_mode": "lyrics", "linked_to_section_id": "0500"}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "type_label": "Refrain",
        "content_mode": "lyrics",
        "lyrics_text": "Shine on",
        "linked_to_section_id": "0500",
        "words": [{"text": "Shine"}, {"text": "on"}]
      }
      """

  @error_case
  Scenario: POST a section linked to a section that is itself a link — 422 and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_sections table contains:
      | id   | song_id | position | type_label | content_mode | linked_to_section_id | status |
      | 0500 | 0200    | 1        | Refrain    | lyrics       |                       | active |
      | 0510 | 0200    | 2        | Refrain    | lyrics       | 0500                  | active |
    When I POST /api/features/tasks/guitar-songs/songs/0200/sections with body:
      """
      {"type_label": "Refrain", "content_mode": "lyrics", "linked_to_section_id": "0510"}
      """
    Then the response status code is 422
    And the guitar_songs_sections table contains:
      | id   | song_id | position | type_label | linked_to_section_id | status |
      | 0500 | 0200    | 1        | Refrain    |                       | active |
      | 0510 | 0200    | 2        | Refrain    | 0500                  | active |

  @error_case
  Scenario: POST a section as a guest — 403 and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | guest    | active |
    And the guitar_songs_sections table contains:
      | id | song_id | position | type_label | content_mode | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/sections with body:
      """
      {"type_label": "Intro", "content_mode": "chords_only"}
      """
    Then the response status code is 403
    And the guitar_songs_sections table contains:
      | id | song_id | position | type_label | content_mode | status |
