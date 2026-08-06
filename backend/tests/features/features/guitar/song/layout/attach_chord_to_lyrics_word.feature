Feature: Attach a chord to a word in a "Lyrics & Chords" block
  As a project member
  I want to attach a chord at a fixed position around any word
  So that the printed song shows exactly where to change chords

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
      | id   | name | root_note | frets         | status |
      | 0300 | Em7  | E         | [0,2,0,0,0,0] | active |
      | 0301 | G    | G         | [3,2,0,0,3,3] | active |
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | lyrics_text | lyrics_words                                                                  | status |
      | 0711 | 0710      | 0200    | 1        | sections   | Hello   world | [[{"text": "Hello", "chords": {}}, {"text": "", "chords": {}}, {"text": "world", "chords": {}}]] | active |

  Scenario: PATCH a chord at 'start' on a word — it resolves from the shared chord inventory
    Given I am authenticated as a regular user: user.id 0002
    When I PATCH /api/features/tasks/guitar-songs/layout/blocks/0711/lyrics-words/0/0/chords/start with body:
      """
      {"chord_id": "0300"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "lyrics_words": [[
          {"text": "Hello", "chords": {"start": {"id": "0300", "name": "Em7"}}},
          {"text": "", "chords": {}},
          {"text": "world", "chords": {}}
        ]]
      }
      """

  Scenario: PATCH two different positions on the same word — both coexist
    Given I am authenticated as a regular user: user.id 0002
    When I PATCH /api/features/tasks/guitar-songs/layout/blocks/0711/lyrics-words/0/0/chords/start with body:
      """
      {"chord_id": "0300"}
      """
    Then the response status code is 200
    When I PATCH /api/features/tasks/guitar-songs/layout/blocks/0711/lyrics-words/0/0/chords/after with body:
      """
      {"chord_id": "0301"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "lyrics_words": [[
          {"text": "Hello", "chords": {"start": {"id": "0300", "name": "Em7"}, "after": {"id": "0301", "name": "G"}}},
          {"text": "", "chords": {}},
          {"text": "world", "chords": {}}
        ]]
      }
      """

  Scenario: PATCH with chord_id null — the word is detached, the block loses that chord attachment
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | lyrics_text | lyrics_words                                                                                | status |
      | 0712 | 0710      | 0200    | 2        | sections   | Hello       | [[{"text": "Hello", "chords": {"start": "00000000-0000-0000-0000-000000000300"}}]]          | active |
    When I PATCH /api/features/tasks/guitar-songs/layout/blocks/0712/lyrics-words/0/0/chords/start with body:
      """
      {"chord_id": null}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {"lyrics_words": [[{"text": "Hello", "chords": {}}]]}
      """

  Scenario: PATCH a chord onto an empty word slot — it attaches like any other word
    Given I am authenticated as a regular user: user.id 0002
    When I PATCH /api/features/tasks/guitar-songs/layout/blocks/0711/lyrics-words/0/1/chords/start with body:
      """
      {"chord_id": "0300"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "lyrics_words": [[
          {"text": "Hello", "chords": {}},
          {"text": "", "chords": {"start": {"id": "0300", "name": "Em7"}}},
          {"text": "world", "chords": {}}
        ]]
      }
      """

  @error_case
  Scenario: PATCH a word coordinate out of range — 404 and nothing changes
    Given I am authenticated as a regular user: user.id 0002
    When I PATCH /api/features/tasks/guitar-songs/layout/blocks/0711/lyrics-words/0/9/chords/start with body:
      """
      {"chord_id": "0300"}
      """
    Then the response status code is 404

  @error_case
  Scenario: PATCH a word chord on a block with no lyrics set up yet — 404 and nothing changes
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | status |
      | 0713 | 0710      | 0200    | 3        | sections   | active |
    When I PATCH /api/features/tasks/guitar-songs/layout/blocks/0713/lyrics-words/0/0/chords/start with body:
      """
      {"chord_id": "0301"}
      """
    Then the response status code is 404
