Feature: Edit a "Lyrics & Chords" block's lyrics text
  As a project member
  I want to edit a block's lyrics text without losing the chords I've already attached
  So that fixing a typo or adding a line doesn't force me to re-attach every chord

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
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs table contains:
      | id   | project_id | title      | author | status |
      | 0200 | 0020       | Wonderwall | Oasis  | active |
    And the guitar_songs_layout_rows table contains:
      | id   | song_id | position | page_break_before | status |
      | 0700 | 0200    | 1        | false              | active |
    And the guitar_songs_layout_columns table contains:
      | id   | row_id | song_id | position | width_twelfths | align | status |
      | 0710 | 0700   | 0200    | 1        | 12             | left  | active |
    And the guitar_chords table contains:
      | id   | name  | root_note | frets         | status |
      | 0300 | Em7   | E         | [0,2,0,0,0,0] | active |
      | 0301 | G     | G         | [3,2,0,0,3,3] | active |
      | 0302 | Dsus4 | D         | [-1,-1,0,2,3,3] | active |

  Scenario: Editing lyrics text keeps the chord on a word that only shifted position
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | lyrics_text  | lyrics_words                                                                                     | status |
      | 0711 | 0710      | 0200    | 1        | sections   | Hello world  | [[{"text": "Hello", "chords": {"start": "00000000-0000-0000-0000-000000000300"}}, {"text": "world", "chords": {}}]] | active |
    When I PATCH /api/features/tasks/guitar-songs/layout/blocks/0711 with body:
      """
      {"lyrics_text": "Well Hello world"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "lyrics_text": "Well Hello world",
        "lyrics_words": [[
          {"text": "Well", "chords": {}},
          {"text": "Hello", "chords": {"start": {"id": "0300", "name": "Em7"}}},
          {"text": "world", "chords": {}}
        ]]
      }
      """

  Scenario: Editing lyrics text drops the chord on a word that changed, keeps it on words that didn't
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | lyrics_text        | lyrics_words                                                                                                                                                                                    | status |
      | 0712 | 0710      | 0200    | 2        | sections   | Hello cruel world  | [[{"text": "Hello", "chords": {"start": "00000000-0000-0000-0000-000000000300"}}, {"text": "cruel", "chords": {"middle": "00000000-0000-0000-0000-000000000302"}}, {"text": "world", "chords": {"start": "00000000-0000-0000-0000-000000000301"}}]] | active |
    When I PATCH /api/features/tasks/guitar-songs/layout/blocks/0712 with body:
      """
      {"lyrics_text": "Hello big world"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "lyrics_text": "Hello big world",
        "lyrics_words": [[
          {"text": "Hello", "chords": {"start": {"id": "0300", "name": "Em7"}}},
          {"text": "big", "chords": {}},
          {"text": "world", "chords": {"start": {"id": "0301", "name": "G"}}}
        ]]
      }
      """

  Scenario: Editing lyrics text keeps a chord attached to an empty strum slot
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | lyrics_text     | lyrics_words                                                                                                                                                       | status |
      | 0713 | 0710      | 0200    | 3        | sections   | Hello   world   | [[{"text": "Hello", "chords": {}}, {"text": "", "chords": {"start": "00000000-0000-0000-0000-000000000300"}}, {"text": "world", "chords": {}}]]                  | active |
    When I PATCH /api/features/tasks/guitar-songs/layout/blocks/0713 with body:
      """
      {"lyrics_text": "Well Hello   world"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "lyrics_text": "Well Hello   world",
        "lyrics_words": [[
          {"text": "Well", "chords": {}},
          {"text": "Hello", "chords": {}},
          {"text": "", "chords": {"start": {"id": "0300", "name": "Em7"}}},
          {"text": "world", "chords": {}}
        ]]
      }
      """

  Scenario: Editing lyrics text on a block that links to another — the edit lands on the target, not the link
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | lyrics_text | lyrics_words                                            | status |
      | 0714 | 0710      | 0200    | 4        | sections   | Hello world | [[{"text": "Hello", "chords": {}}, {"text": "world", "chords": {}}]] | active |
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | linked_to_block_id | status |
      | 0715 | 0710      | 0200    | 5        | sections   | 0714                | active |
    When I PATCH /api/features/tasks/guitar-songs/layout/blocks/0715 with body:
      """
      {"lyrics_text": "Hi there"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {"lyrics_text": "Hi there", "linked_to_block_id": "0714"}
      """
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | block_type | lyrics_text | linked_to_block_id | status |
      | 0714 | 0710      | sections   | Hi there    |                     | active |
      | 0715 | 0710      | sections   |             | 0714                | active |
