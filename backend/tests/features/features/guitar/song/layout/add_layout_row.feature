Feature: Add a row to a guitar song's presentation layout
  As a project member
  I want to add a row of columns to a song's presentation/print layout
  So that I can build the printable page I want for the song

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

  Scenario: POST a row with two columns summing to 12/12 — it is added at position 1
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows with body:
      """
      {
        "page_break_before": false,
        "columns": [
          {"blocks": [{"block_type": "author"}], "width_twelfths": 3, "align": "left"},
          {"blocks": [{"block_type": "tempo"}, {"block_type": "time_signature"}, {"block_type": "capo"}], "width_twelfths": 9, "align": "left"}
        ]
      }
      """
    Then the response status code is 201
    And the guitar_songs_layout_rows table contains:
      | song_id | position | page_break_before | status |
      | 0200    | 1        | false              | active |
    And the guitar_songs_layout_columns table contains:
      | song_id | position | width_twelfths | align | status |
      | 0200    | 1        | 3              | left  | active |
      | 0200    | 2        | 9              | left  | active |
    And the guitar_songs_layout_column_blocks table contains:
      | song_id | position | block_type     | status |
      | 0200    | 1        | author         | active |
      | 0200    | 1        | tempo          | active |
      | 0200    | 2        | time_signature | active |
      | 0200    | 3        | capo           | active |

  Scenario: POST a row with a column stacking two blocks — both are saved in order
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows with body:
      """
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "title"}, {"block_type": "author"}], "width_twelfths": 8, "align": "left"}]}
      """
    Then the response status code is 201
    And the guitar_songs_layout_column_blocks table contains:
      | song_id | position | block_type | status |
      | 0200    | 1        | title      | active |
      | 0200    | 2        | author     | active |

  Scenario: POST a row with a custom block — its title and rich text are saved as a document
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |
    And the documents table contains:
      | id | content_html | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows with body:
      """
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "custom", "custom_title": "Practice tips", "custom_content_html": "<p>Play softly.</p>"}], "width_twelfths": 8, "align": "left"}]}
      """
    Then the response status code is 201
    And the guitar_songs_layout_column_blocks table contains:
      | song_id | position | block_type | custom_title   | status |
      | 0200    | 1        | custom     | Practice tips  | active |
    And the documents table contains:
      | content_html          | status |
      | <p>Play softly.</p>   | active |

  Scenario: POST a row with two custom blocks in the same column — both are kept, no conflict
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows with body:
      """
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "custom", "custom_title": "Note A"}, {"block_type": "custom", "custom_title": "Note B"}], "width_twelfths": 8, "align": "left"}]}
      """
    Then the response status code is 201
    And the guitar_songs_layout_column_blocks table contains:
      | song_id | position | block_type | custom_title | status |
      | 0200    | 1        | custom     | Note A       | active |
      | 0200    | 2        | custom     | Note B       | active |

  Scenario: POST a row with a custom block with no title yet — it's created untitled, ready to be named from the song's page
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows with body:
      """
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "custom"}], "width_twelfths": 8, "align": "left"}]}
      """
    Then the response status code is 201
    And the guitar_songs_layout_column_blocks table contains:
      | song_id | position | block_type | width_twelfths | custom_title | status |
      | 0200    | 1        | custom     | 12             |              | active |

  Scenario: POST a row with a chord grid block — its title, comment and grid are saved
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |
    And the documents table contains:
      | id | content_html | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows with body:
      """
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "chord_grid", "custom_title": "Intro sequence", "custom_content_html": "<p>Strum softly.</p>", "chord_grid_rows": [[{"border_top": true, "border_right": true, "border_bottom": true, "border_left": true, "items": [{"item_type": "text", "text": "Intro"}]}]]}], "width_twelfths": 8, "align": "left"}]}
      """
    Then the response status code is 201
    And the guitar_songs_layout_column_blocks table contains:
      | song_id | position | block_type | custom_title    | status |
      | 0200    | 1        | chord_grid | Intro sequence  | active |
    And the response body includes:
      """
      {
        "rows": [
          {
            "columns": [
              {
                "blocks": [
                  {
                    "block_type": "chord_grid",
                    "custom_title": "Intro sequence",
                    "custom_content_html": "<p>Strum softly.</p>",
                    "chord_grid_rows": [
                      [
                        {
                          "border_top": true, "border_right": true, "border_bottom": true, "border_left": true,
                          "items": [{"item_type": "text", "chord_id": null, "text": "Intro"}]
                        }
                      ]
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
      """

  Scenario: POST a row with two chord grid blocks — both are kept, no conflict (repeatable block type)
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows with body:
      """
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "chord_grid", "custom_title": "Grid A"}, {"block_type": "chord_grid", "custom_title": "Grid B"}], "width_twelfths": 8, "align": "left"}]}
      """
    Then the response status code is 201
    And the guitar_songs_layout_column_blocks table contains:
      | song_id | position | block_type | custom_title | status |
      | 0200    | 1        | chord_grid | Grid A       | active |
      | 0200    | 2        | chord_grid | Grid B       | active |

  @error_case
  Scenario: POST a row with a jagged chord grid (rows of different column counts) — 422 and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows with body:
      """
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "chord_grid", "chord_grid_rows": [[{"items": []}, {"items": []}], [{"items": []}]]}], "width_twelfths": 8, "align": "left"}]}
      """
    Then the response status code is 422
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |

  @error_case
  Scenario: POST a row with a custom block width outside 1-12 — 422 and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows with body:
      """
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "custom", "width_twelfths": 13}], "width_twelfths": 8, "align": "left"}]}
      """
    Then the response status code is 422
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |

  @error_case
  Scenario: POST a row with a "videos" block — 422, videos are metadata only and no longer placeable in the layout
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows with body:
      """
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "videos"}], "width_twelfths": 8, "align": "left"}]}
      """
    Then the response status code is 422
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |

  Scenario: POST a second row — it lands after the first
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_layout_rows table contains:
      | id   | song_id | position | page_break_before | status |
      | 0700 | 0200    | 1        | false              | active |
    And the guitar_songs_layout_columns table contains:
      | id   | row_id | song_id | position | width_twelfths | align | status |
      | 0710 | 0700   | 0200    | 1        | 8              | left  | active |
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | status |
      | 0711 | 0710      | 0200    | 1        | title      | active |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows with body:
      """
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "chords"}], "width_twelfths": 8, "align": "left"}]}
      """
    Then the response status code is 201
    And the guitar_songs_layout_rows table contains:
      | song_id | position | page_break_before | status |
      | 0200    | 1        | false              | active |
      | 0200    | 2        | false              | active |

  Scenario: POST a row with insert_before_row_id — it lands before that row, pushing it down
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_layout_rows table contains:
      | id   | song_id | position | page_break_before | status |
      | 0700 | 0200    | 1        | false              | active |
      | 0701 | 0200    | 2        | false              | active |
    And the guitar_songs_layout_columns table contains:
      | id   | row_id | song_id | position | width_twelfths | align | status |
      | 0710 | 0700   | 0200    | 1        | 8              | left  | active |
      | 0720 | 0701   | 0200    | 1        | 8              | left  | active |
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | status |
      | 0711 | 0710      | 0200    | 1        | title      | active |
      | 0721 | 0720      | 0200    | 1        | description | active |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows?insert_before_row_id=00000000-0000-0000-0000-000000000701 with body:
      """
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "chords"}], "width_twelfths": 8, "align": "left"}]}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "rows": [
          {"position": 1, "columns": [{"blocks": [{"block_type": "title"}]}]},
          {"position": 2, "columns": [{"blocks": [{"block_type": "chords"}]}]},
          {"position": 3, "columns": [{"blocks": [{"block_type": "description"}]}]}
        ]
      }
      """

  Scenario: POST a row whose column widths sum to less than 12/12 — it is added with room left unused
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows with body:
      """
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "author"}], "width_twelfths": 2, "align": "left"}]}
      """
    Then the response status code is 201
    And the guitar_songs_layout_columns table contains:
      | song_id | position | width_twelfths | align | status |
      | 0200    | 1        | 2              | left  | active |

  @error_case
  Scenario: POST a row whose column widths sum to more than 12/12 — 422 and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows with body:
      """
      {
        "page_break_before": false,
        "columns": [
          {"blocks": [{"block_type": "author"}], "width_twelfths": 8, "align": "left"},
          {"blocks": [{"block_type": "tempo"}], "width_twelfths": 6, "align": "left"}
        ]
      }
      """
    Then the response status code is 422
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |

  @error_case
  Scenario: POST a row reusing a block already used by another row — 422 and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_layout_rows table contains:
      | id   | song_id | position | page_break_before | status |
      | 0700 | 0200    | 1        | false              | active |
    And the guitar_songs_layout_columns table contains:
      | id   | row_id | song_id | position | width_twelfths | align | status |
      | 0710 | 0700   | 0200    | 1        | 8              | left  | active |
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | status |
      | 0711 | 0710      | 0200    | 1        | title      | active |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows with body:
      """
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "title"}], "width_twelfths": 8, "align": "left"}]}
      """
    Then the response status code is 422
    And the guitar_songs_layout_rows table contains:
      | song_id | position | page_break_before | status |
      | 0200    | 1        | false              | active |

  Scenario: POST a row reusing a 'sections' block already used elsewhere — it's added anyway, since Lyrics & Chords may repeat
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_layout_rows table contains:
      | id   | song_id | position | page_break_before | status |
      | 0700 | 0200    | 1        | false              | active |
    And the guitar_songs_layout_columns table contains:
      | id   | row_id | song_id | position | width_twelfths | align | status |
      | 0710 | 0700   | 0200    | 1        | 8              | left  | active |
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | status |
      | 0711 | 0710      | 0200    | 1        | sections   | active |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows with body:
      """
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "sections"}], "width_twelfths": 8, "align": "left"}]}
      """
    Then the response status code is 201
    And the guitar_songs_layout_column_blocks table contains:
      | song_id | block_type | status |
      | 0200    | sections   | active |
      | 0200    | sections   | active |

  @error_case
  Scenario: POST a row using the same block twice in one column — 422 and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows with body:
      """
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "title"}, {"block_type": "title"}], "width_twelfths": 8, "align": "left"}]}
      """
    Then the response status code is 422
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |

  Scenario: POST a row with a block's zoom and card framing set — both are saved
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows with body:
      """
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "title", "zoom_percent": 150, "show_card": true}], "width_twelfths": 8, "align": "left"}]}
      """
    Then the response status code is 201
    And the guitar_songs_layout_column_blocks table contains:
      | song_id | position | block_type | zoom_percent | show_card | status |
      | 0200    | 1        | title      | 150          | true      | active |

  Scenario: POST a row with a block's title heading level set — it is saved
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows with body:
      """
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "title", "title_heading_level": "h1"}], "width_twelfths": 8, "align": "left"}]}
      """
    Then the response status code is 201
    And the guitar_songs_layout_column_blocks table contains:
      | song_id | position | block_type | title_heading_level | status |
      | 0200    | 1        | title      | h1                   | active |

  Scenario: POST a row without a title heading level for a block — it defaults to h3
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows with body:
      """
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "title"}], "width_twelfths": 8, "align": "left"}]}
      """
    Then the response status code is 201
    And the guitar_songs_layout_column_blocks table contains:
      | song_id | position | block_type | title_heading_level | status |
      | 0200    | 1        | title      | h3                   | active |

  @error_case
  Scenario: POST a row with an invalid title heading level for a block — 422 and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows with body:
      """
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "title", "title_heading_level": "h6"}], "width_twelfths": 8, "align": "left"}]}
      """
    Then the response status code is 422
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |

  @error_case
  Scenario: POST a row with a block's zoom outside 30-200 — 422 and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows with body:
      """
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "title", "zoom_percent": 25}], "width_twelfths": 8, "align": "left"}]}
      """
    Then the response status code is 422
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |

  @error_case
  Scenario: POST a row as a project guest — 403 and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1002 | 0010     | 0030      | guest    | active |
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows with body:
      """
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "title"}], "width_twelfths": 8, "align": "left"}]}
      """
    Then the response status code is 403
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |

  Scenario: POST a row with a pasted 'sections' block's lyrics — its content is saved on the new block
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_chords table contains:
      | id   | name | root_note | frets         | status |
      | 0300 | Em7  | E         | [0,2,0,0,0,0] | active |
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows with body:
      """
      {
        "page_break_before": false,
        "columns": [{
          "blocks": [{
            "block_type": "sections",
            "lyrics_text": "Hello world",
            "lyrics_words": [[
              {"text": "Hello", "chords": {"start": "0300"}},
              {"text": "world", "chords": {}}
            ]]
          }],
          "width_twelfths": 12,
          "align": "left"
        }]
      }
      """
    Then the response status code is 201
    And the guitar_songs_layout_column_blocks table contains:
      | song_id | position | block_type | lyrics_text | status |
      | 0200    | 1        | sections   | Hello world | active |
    And the response body includes:
      """
      {
        "rows": [
          {
            "columns": [
              {
                "blocks": [
                  {
                    "lyrics_words": [[
                      {"text": "Hello", "chords": {"start": {"id": "0300", "name": "Em7"}}},
                      {"text": "world", "chords": {}}
                    ]]
                  }
                ]
              }
            ]
          }
        ]
      }
      """

  Scenario: POST a row with a pasted 'sections' block's mirror link — it links to the same target
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_layout_rows table contains:
      | id   | song_id | position | page_break_before | status |
      | 0700 | 0200    | 1        | false              | active |
    And the guitar_songs_layout_columns table contains:
      | id   | row_id | song_id | position | width_twelfths | align | status |
      | 0710 | 0700   | 0200    | 1        | 12             | left  | active |
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | lyrics_text | status |
      | 0711 | 0710      | 0200    | 1        | sections   | Verse one   | active |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows with body:
      """
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "sections", "linked_to_block_id": "0711"}], "width_twelfths": 12, "align": "left"}]}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "rows": [
          {},
          {
            "columns": [
              {
                "blocks": [
                  {"block_type": "sections", "lyrics_text": "Verse one", "linked_to_block_id": "0711"}
                ]
              }
            ]
          }
        ]
      }
      """
