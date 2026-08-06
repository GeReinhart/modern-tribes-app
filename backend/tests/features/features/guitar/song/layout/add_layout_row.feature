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

  Scenario: POST a row with two columns summing to 8/8 — it is added at position 1
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
          {"blocks": [{"block_type": "author"}], "width_eighths": 2, "align": "left"},
          {"blocks": [{"block_type": "tempo"}, {"block_type": "time_signature"}, {"block_type": "capo"}], "width_eighths": 6, "align": "left"}
        ]
      }
      """
    Then the response status code is 201
    And the guitar_songs_layout_rows table contains:
      | song_id | position | page_break_before | status |
      | 0200    | 1        | false              | active |
    And the guitar_songs_layout_columns table contains:
      | song_id | position | width_eighths | align | status |
      | 0200    | 1        | 2              | left  | active |
      | 0200    | 2        | 6              | left  | active |
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
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "title"}, {"block_type": "author"}], "width_eighths": 8, "align": "left"}]}
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
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "custom", "custom_title": "Practice tips", "custom_content_html": "<p>Play softly.</p>"}], "width_eighths": 8, "align": "left"}]}
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
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "custom", "custom_title": "Note A"}, {"block_type": "custom", "custom_title": "Note B"}], "width_eighths": 8, "align": "left"}]}
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
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "custom"}], "width_eighths": 8, "align": "left"}]}
      """
    Then the response status code is 201
    And the guitar_songs_layout_column_blocks table contains:
      | song_id | position | block_type | width_eighths | custom_title | status |
      | 0200    | 1        | custom     | 8              |              | active |

  @error_case
  Scenario: POST a row with a custom block width outside 1-8 — 422 and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows with body:
      """
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "custom", "width_eighths": 9}], "width_eighths": 8, "align": "left"}]}
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
      | id   | row_id | song_id | position | width_eighths | align | status |
      | 0710 | 0700   | 0200    | 1        | 8              | left  | active |
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | status |
      | 0711 | 0710      | 0200    | 1        | title      | active |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows with body:
      """
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "chords"}], "width_eighths": 8, "align": "left"}]}
      """
    Then the response status code is 201
    And the guitar_songs_layout_rows table contains:
      | song_id | position | page_break_before | status |
      | 0200    | 1        | false              | active |
      | 0200    | 2        | false              | active |

  @error_case
  Scenario: POST a row whose column widths don't sum to 8/8 — 422 and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows with body:
      """
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "author"}], "width_eighths": 2, "align": "left"}]}
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
      | id   | row_id | song_id | position | width_eighths | align | status |
      | 0710 | 0700   | 0200    | 1        | 8              | left  | active |
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | status |
      | 0711 | 0710      | 0200    | 1        | title      | active |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows with body:
      """
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "title"}], "width_eighths": 8, "align": "left"}]}
      """
    Then the response status code is 422
    And the guitar_songs_layout_rows table contains:
      | song_id | position | page_break_before | status |
      | 0200    | 1        | false              | active |

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
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "title"}, {"block_type": "title"}], "width_eighths": 8, "align": "left"}]}
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
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "title", "zoom_percent": 150, "show_card": true}], "width_eighths": 8, "align": "left"}]}
      """
    Then the response status code is 201
    And the guitar_songs_layout_column_blocks table contains:
      | song_id | position | block_type | zoom_percent | show_card | status |
      | 0200    | 1        | title      | 150          | true      | active |

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
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "title", "zoom_percent": 25}], "width_eighths": 8, "align": "left"}]}
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
      {"page_break_before": false, "columns": [{"blocks": [{"block_type": "title"}], "width_eighths": 8, "align": "left"}]}
      """
    Then the response status code is 403
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |
