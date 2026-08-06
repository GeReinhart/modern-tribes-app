Feature: Edit a custom layout block's title and rich text from the song page
  As a project member
  I want to edit a custom block's title and content without touching the layout structure
  So that authoring content stays separate from designing the page

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
      | 0710 | 0700   | 0200    | 1        | 8              | left  | active |
    And the documents table contains:
      | id   | content_html      | status |
      | 0900 | <p>Old notes</p>  | active |
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | width_twelfths | custom_title | custom_document_id | status |
      | 0711 | 0710      | 0200    | 1        | custom     | 8             | Old title    | 0900               | active |

  Scenario: PATCH a custom block's title and content — both update without touching the layout row
    Given I am authenticated as a regular user: user.id 0002
    When I PATCH /api/features/tasks/guitar-songs/layout/blocks/0711 with body:
      """
      {"custom_title": "Practice notes", "custom_content_html": "<p>New notes</p>"}
      """
    Then the response status code is 200
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | block_type | custom_title     | custom_document_id | status |
      | 0711 | 0710      | custom     | Practice notes   | 0900                | active |
    And the documents table contains:
      | id   | content_html       | status |
      | 0900 | <p>New notes</p>   | active |
    And the guitar_songs_layout_rows table contains:
      | id   | song_id | position | status |
      | 0700 | 0200    | 1        | active |

  Scenario: PATCH a chord grid's title, comment and grid — all update
    Given I am authenticated as a regular user: user.id 0002
    And the documents table contains:
      | id   | content_html | status |
      | 0901 | <p>Old comment</p> | active |
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | custom_title | custom_document_id | status |
      | 0713 | 0710      | 0200    | 2        | chord_grid | Untitled     | 0901                | active |
    When I PATCH /api/features/tasks/guitar-songs/layout/blocks/0713 with body:
      """
      {"custom_title": "Chorus grid", "custom_content_html": "<p>New comment</p>", "chord_grid_rows": [[{"border_bottom": true, "items": [{"item_type": "text", "text": "x4"}]}]]}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "block_type": "chord_grid",
        "custom_title": "Chorus grid",
        "custom_content_html": "<p>New comment</p>",
        "chord_grid_rows": [[{"border_top": false, "border_right": false, "border_bottom": true, "border_left": false, "items": [{"item_type": "text", "chord_id": null, "text": "x4"}]}]]
      }
      """
    And the documents table contains:
      | id   | content_html        | status |
      | 0900 | <p>Old notes</p>    | active |
      | 0901 | <p>New comment</p>  | active |

  Scenario: PATCH a chord grid referencing a chord that exists in the shared inventory — it resolves for display
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_chords table contains:
      | id   | name | root_note | frets         | status |
      | 0300 | Em7  | E         | [0,2,0,0,0,0] | active |
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | status |
      | 0714 | 0710      | 0200    | 3        | chord_grid | active |
    When I PATCH /api/features/tasks/guitar-songs/layout/blocks/0714 with body:
      """
      {"chord_grid_rows": [[{"items": [{"item_type": "chord", "chord_id": "0300"}]}]]}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "chord_grid_rows": [[
          {"border_top": false, "border_right": false, "border_bottom": false, "border_left": false,
           "items": [{"item_type": "chord", "chord_id": "0300", "text": null}]}
        ]]
      }
      """

  Scenario: PATCH a 'chords' block's list — chords are saved in order, each with its own comment
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_chords table contains:
      | id   | name | root_note | frets         | status |
      | 0300 | Em7  | E         | [0,2,0,0,0,0] | active |
      | 0301 | G    | G         | [3,2,0,0,3,3] | active |
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | custom_title | status |
      | 0730 | 0710      | 0200    | 12       | chords     | Main chords  | active |
    When I PATCH /api/features/tasks/guitar-songs/layout/blocks/0730 with body:
      """
      {"chords": [{"chord_id": "0300", "comment": "capo 2"}, {"chord_id": "0301"}]}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "block_type": "chords",
        "custom_title": "Main chords",
        "chords": [
          {"chord_id": "0300", "comment": "capo 2", "chord": {"id": "0300", "name": "Em7"}},
          {"chord_id": "0301", "comment": null, "chord": {"id": "0301", "name": "G"}}
        ]
      }
      """

  @error_case
  Scenario: PATCH a 'chords' block with the same chord twice in its own list — 422, nothing changes
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_chords table contains:
      | id   | name | root_note | frets         | status |
      | 0300 | Em7  | E         | [0,2,0,0,0,0] | active |
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | chords | status |
      | 0733 | 0710      | 0200    | 15       | chords     |        | active |
    When I PATCH /api/features/tasks/guitar-songs/layout/blocks/0733 with body:
      """
      {"chords": [{"chord_id": "0300"}, {"chord_id": "0300", "comment": "again"}]}
      """
    Then the response status code is 422
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | block_type | chords | status |
      | 0711 | 0710      | custom     |        | active |
      | 0733 | 0710      | chords     |        | active |

  @error_case
  Scenario: PATCH the chords of a non-'chords' block — 409 and nothing changes
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_chords table contains:
      | id   | name | root_note | frets         | status |
      | 0300 | Em7  | E         | [0,2,0,0,0,0] | active |
    When I PATCH /api/features/tasks/guitar-songs/layout/blocks/0711 with body:
      """
      {"chords": [{"chord_id": "0300"}]}
      """
    Then the response status code is 409
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | block_type | chords | status |
      | 0711 | 0710      | custom     |        | active |

  @error_case
  Scenario: PATCH a chord grid with a jagged grid — 422 and nothing changes
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | custom_title | status |
      | 0715 | 0710      | 0200    | 4        | chord_grid | Original     | active |
    When I PATCH /api/features/tasks/guitar-songs/layout/blocks/0715 with body:
      """
      {"custom_title": "Should not apply", "chord_grid_rows": [[{"items": []}, {"items": []}], [{"items": []}]]}
      """
    Then the response status code is 422
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | block_type | custom_title | status |
      | 0711 | 0710      | custom     | Old title    | active |
      | 0715 | 0710      | chord_grid | Original     | active |

  Scenario: PATCH a chord grid's chord size alone — it updates without touching the grid or title
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | custom_title | chord_grid_rows                                        | status |
      | 0740 | 0710      | 0200    | 6        | chord_grid | Verse grid   | [[{"items": [{"item_type": "text", "text": "x4"}]}]]   | active |
    When I PATCH /api/features/tasks/guitar-songs/layout/blocks/0740 with body:
      """
      {"chord_grid_chord_size_px": 26}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "block_type": "chord_grid",
        "custom_title": "Verse grid",
        "chord_grid_chord_size_px": 26,
        "chord_grid_rows": [[{"border_top": false, "border_right": false, "border_bottom": false, "border_left": false, "items": [{"item_type": "text", "chord_id": null, "text": "x4"}]}]]
      }
      """
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | block_type | custom_title | chord_grid_chord_size_px | status |
      | 0711 | 0710      | custom     | Old title    | 18                       | active |
      | 0740 | 0710      | chord_grid | Verse grid   | 26                       | active |

  @error_case
  Scenario: PATCH chord_grid_chord_size_px on a non-chord-grid block — 409 and nothing changes
    Given I am authenticated as a regular user: user.id 0002
    When I PATCH /api/features/tasks/guitar-songs/layout/blocks/0711 with body:
      """
      {"chord_grid_chord_size_px": 26}
      """
    Then the response status code is 409
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | block_type | custom_title | chord_grid_chord_size_px | status |
      | 0711 | 0710      | custom     | Old title    | 18                       | active |

  @error_case
  Scenario: PATCH a chord grid's chord size out of range — 422 and nothing changes
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | custom_title | status |
      | 0741 | 0710      | 0200    | 7        | chord_grid | Bridge grid  | active |
    When I PATCH /api/features/tasks/guitar-songs/layout/blocks/0741 with body:
      """
      {"chord_grid_chord_size_px": 100}
      """
    Then the response status code is 422
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | block_type | custom_title | chord_grid_chord_size_px | status |
      | 0711 | 0710      | custom     | Old title    | 18                       | active |
      | 0741 | 0710      | chord_grid | Bridge grid  | 18                       | active |

  @error_case
  Scenario: PATCH the content of a non-custom block — 409 and nothing changes
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | width_twelfths | status |
      | 0712 | 0710      | 0200    | 2        | title      | 8              | active |
    When I PATCH /api/features/tasks/guitar-songs/layout/blocks/0712 with body:
      """
      {"custom_title": "Should not apply"}
      """
    Then the response status code is 409
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | block_type | custom_title | status |
      | 0711 | 0710      | custom     | Old title    | active |
      | 0712 | 0710      | title      |              | active |

  Scenario: PATCH a 'sections' block's title on its own — no need to also send its content
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | lyrics_text | status |
      | 0723 | 0710      | 0200    | 9        | sections   | Verse one   | active |
    When I PATCH /api/features/tasks/guitar-songs/layout/blocks/0723 with body:
      """
      {"custom_title": "Verse"}
      """
    Then the response status code is 200
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | block_type | custom_title | lyrics_text | status |
      | 0711 | 0710      | custom     | Old title    |             | active |
      | 0723 | 0710      | sections   | Verse        | Verse one   | active |

  @error_case
  Scenario: PATCH a title on a block type with no title of its own — 409 and nothing changes
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | status |
      | 0724 | 0710      | 0200    | 10       | tempo      | active |
    When I PATCH /api/features/tasks/guitar-songs/layout/blocks/0724 with body:
      """
      {"custom_title": "Should not apply"}
      """
    Then the response status code is 409
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | block_type | custom_title | status |
      | 0711 | 0710      | custom     | Old title    | active |
      | 0724 | 0710      | tempo      |              | active |

  Scenario: PATCH a 'sections' block's lyrics — its lyrics_words are tokenized
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | status |
      | 0716 | 0710      | 0200    | 5        | sections   | active |
    When I PATCH /api/features/tasks/guitar-songs/layout/blocks/0716 with body:
      """
      {"lyrics_text": "Today is gonna be the day"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "block_type": "sections",
        "lyrics_text": "Today is gonna be the day",
        "lyrics_words": [[
          {"text": "Today", "chords": {}}, {"text": "is", "chords": {}}, {"text": "gonna", "chords": {}},
          {"text": "be", "chords": {}}, {"text": "the", "chords": {}}, {"text": "day", "chords": {}}
        ]]
      }
      """
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | block_type | lyrics_text               | status |
      | 0711 | 0710      | custom     |                            | active |
      | 0716 | 0710      | sections   | Today is gonna be the day | active |

  Scenario: PATCH a 'sections' block to link to another — its content resolves from the target
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | lyrics_text        | status |
      | 0717 | 0710      | 0200    | 6        | sections   | Backbeat the word  | active |
      | 0718 | 0710      | 0200    | 7        | sections   |                    | active |
    When I PATCH /api/features/tasks/guitar-songs/layout/blocks/0718 with body:
      """
      {"linked_to_block_id": "0717"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "block_type": "sections",
        "lyrics_text": "Backbeat the word",
        "linked_to_block_id": "0717"
      }
      """

  @error_case
  Scenario: PATCH a 'sections' block to link to a block that is itself a link — 422 and nothing changes
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | lyrics_text | status |
      | 0719 | 0710      | 0200    | 8        | sections   | Verse one   | active |
      | 0720 | 0710      | 0200    | 9        | sections   |             | active |
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | linked_to_block_id | status |
      | 0721 | 0710      | 0200    | 10       | sections   | 0719                | active |
    When I PATCH /api/features/tasks/guitar-songs/layout/blocks/0720 with body:
      """
      {"linked_to_block_id": "0721"}
      """
    Then the response status code is 422
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | block_type | linked_to_block_id | status |
      | 0711 | 0710      | custom     |                     | active |
      | 0719 | 0710      | sections   |                     | active |
      | 0720 | 0710      | sections   |                     | active |
      | 0721 | 0710      | sections   | 0719                | active |

  @error_case
  Scenario: PATCH a 'sections' block to link to itself — 422 and nothing changes
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | status |
      | 0722 | 0710      | 0200    | 11       | sections   | active |
    When I PATCH /api/features/tasks/guitar-songs/layout/blocks/0722 with body:
      """
      {"linked_to_block_id": "0722"}
      """
    Then the response status code is 422

  @error_case
  Scenario: PATCH lyrics_text on a non-'sections' block — 409 and nothing changes
    Given I am authenticated as a regular user: user.id 0002
    When I PATCH /api/features/tasks/guitar-songs/layout/blocks/0711 with body:
      """
      {"lyrics_text": "Should not apply"}
      """
    Then the response status code is 409
