Feature: Edit, reorder and remove a guitar song's layout rows
  As a project member or manager
  I want to replace a row's columns, move it, or remove it
  So that the printable layout stays exactly how I want it

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
    And the guitar_songs table contains:
      | id   | project_id | title      | author | status |
      | 0200 | 0020       | Wonderwall | Oasis  | active |
    And the guitar_songs_layout_rows table contains:
      | id   | song_id | position | page_break_before | status |
      | 0700 | 0200    | 1        | false              | active |
      | 0701 | 0200    | 2        | false              | active |
    And the guitar_songs_layout_columns table contains:
      | id   | row_id | song_id | position | width_twelfths | align | status |
      | 0710 | 0700   | 0200    | 1        | 8              | left  | active |
      | 0720 | 0701   | 0200    | 1        | 8              | left  | active |
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type  | status |
      | 0711 | 0710      | 0200    | 1        | title       | active |
      | 0721 | 0720      | 0200    | 1        | description | active |

  Scenario: PUT a row's columns — the old columns are archived and the new ones are active
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
    When I PUT /api/features/tasks/guitar-songs/layout/rows/0700 with body:
      """
      {
        "page_break_before": true,
        "columns": [
          {"blocks": [{"block_type": "author"}], "width_twelfths": 3, "align": "center"},
          {"blocks": [{"block_type": "tempo"}, {"block_type": "time_signature"}, {"block_type": "capo"}], "width_twelfths": 5, "align": "right"}
        ]
      }
      """
    Then the response status code is 200
    And the guitar_songs_layout_rows table contains:
      | id   | song_id | position | page_break_before | status |
      | 0700 | 0200    | 1        | true               | active |
      | 0701 | 0200    | 2        | false              | active |
    And the guitar_songs_layout_columns table contains:
      | row_id | width_twelfths | align  | status   |
      | 0700   | 8              | left   | archived |
      | 0700   | 3              | center | active   |
      | 0700   | 5              | right  | active   |
      | 0701   | 8              | left   | active   |
    And the guitar_songs_layout_column_blocks table contains:
      | block_type     | status   |
      | title          | archived |
      | author         | active   |
      | tempo          | active   |
      | time_signature | active   |
      | capo           | active   |
      | description    | active   |

  Scenario: PUT a row's columns with a block's own padding set — it keeps that padding
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
    When I PUT /api/features/tasks/guitar-songs/layout/rows/0700 with body:
      """
      {
        "page_break_before": false,
        "columns": [
          {
            "blocks": [{"block_type": "author", "padding_top_mm": 5, "padding_left_mm": 3.5}],
            "width_twelfths": 8, "align": "left"
          }
        ]
      }
      """
    Then the response status code is 200
    And the guitar_songs_layout_column_blocks table contains:
      | block_type     | padding_top_mm | padding_right_mm | padding_bottom_mm | padding_left_mm | status   |
      | title          | 0.0            | 0.0               | 0.0                | 0.0              | archived |
      | author         | 5.0            | 0.0               | 0.0                | 3.5              | active   |
      | description    | 0.0            | 0.0               | 0.0                | 0.0              | active   |

  Scenario: PUT a row's columns with separator flags set — it keeps them
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
    When I PUT /api/features/tasks/guitar-songs/layout/rows/0700 with body:
      """
      {
        "page_break_before": false,
        "columns": [
          {
            "blocks": [{"block_type": "author"}], "width_twelfths": 4, "align": "left",
            "separator_left": false, "separator_right": true
          },
          {
            "blocks": [{"block_type": "description"}], "width_twelfths": 4, "align": "left",
            "separator_left": true, "separator_right": false
          }
        ]
      }
      """
    Then the response status code is 200
    And the guitar_songs_layout_columns table contains:
      | row_id | width_twelfths | separator_left | separator_right | status   |
      | 0700   | 8               | false           | false            | archived |
      | 0700   | 4               | false           | true             | active   |
      | 0700   | 4               | true            | false            | active   |

  Scenario: PUT a row's columns with one column having no blocks — it is added as a plain spacer
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
    When I PUT /api/features/tasks/guitar-songs/layout/rows/0700 with body:
      """
      {
        "page_break_before": false,
        "columns": [
          {"blocks": [{"block_type": "author"}], "width_twelfths": 4, "align": "left"},
          {"blocks": [], "width_twelfths": 2, "align": "left"}
        ]
      }
      """
    Then the response status code is 200
    And the guitar_songs_layout_columns table contains:
      | row_id | width_twelfths | align | status   |
      | 0700   | 8              | left  | archived |
      | 0700   | 4              | left  | active   |
      | 0700   | 2              | left  | active   |
      | 0701   | 8              | left  | active   |
    And the guitar_songs_layout_column_blocks table contains:
      | block_type     | status   |
      | title          | archived |
      | author         | active   |
      | description    | active   |

  Scenario: PUT a row's columns adding a sibling column — its existing Lyrics & Chords block keeps its lyrics
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
    And the guitar_songs_layout_rows table contains:
      | id   | song_id | position | page_break_before | status |
      | 0703 | 0200    | 3        | false              | active |
    And the guitar_songs_layout_columns table contains:
      | id   | row_id | song_id | position | width_twelfths | align | status |
      | 0740 | 0703   | 0200    | 1        | 4              | left  | active |
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | lyrics_text | status |
      | 0741 | 0740      | 0200    | 1        | sections   | Hello world | active |
    When I PUT /api/features/tasks/guitar-songs/layout/rows/0703 with body:
      """
      {
        "page_break_before": false,
        "columns": [
          {"blocks": [{"block_type": "sections", "lyrics_text": "Hello world"}], "width_twelfths": 4, "align": "left"},
          {"blocks": [{"block_type": "chords"}], "width_twelfths": 4, "align": "left"}
        ]
      }
      """
    Then the response status code is 200
    And the guitar_songs_layout_column_blocks table contains:
      | block_type  | lyrics_text | status   |
      | title       |             | active   |
      | description |             | active   |
      | sections    | Hello world | archived |
      | sections    | Hello world | active   |
      | chords      |             | active   |

  Scenario: PUT a row's columns a second time — two Lyrics & Chords blocks stay correctly linked, not swapped
    Given I am authenticated as an administrator: user.id 0001
    And the guitar_songs_layout_rows table contains:
      | id   | song_id | position | page_break_before | status |
      | 0704 | 0200    | 4        | false              | active |
    And the guitar_songs_layout_columns table contains:
      | id   | row_id | song_id | position | width_twelfths | align | status   |
      | 0752 | 0704   | 0200    | 1        | 4              | left  | archived |
      | 0753 | 0704   | 0200    | 1        | 4              | left  | active   |
      | 0754 | 0704   | 0200    | 2        | 4              | left  | active   |
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | lyrics_text  | linked_to_block_id | status   |
      | 0742 | 0752      | 0200    | 1        | sections   |              |                     | archived |
      | 0743 | 0753      | 0200    | 1        | sections   | Couplet text |                     | active   |
      | 0744 | 0754      | 0200    | 1        | sections   |              | 0743                | active   |
    When I PUT /api/features/tasks/guitar-songs/layout/rows/0704 with body:
      """
      {
        "page_break_before": false,
        "columns": [
          {"blocks": [{"block_type": "sections", "lyrics_text": "Couplet text"}], "width_twelfths": 4, "align": "left"},
          {"blocks": [{"block_type": "sections", "linked_to_block_id": "0743"}], "width_twelfths": 4, "align": "left"}
        ]
      }
      """
    Then the response status code is 200
    And row 0704's mirror block resolves to lyrics text Couplet text

  Scenario: Manager moves the second row up — it swaps position with the first
    Given I am authenticated as an administrator: user.id 0001
    When I POST /api/features/tasks/guitar-songs/layout/rows/0701/move with body:
      """
      {"direction": "prev"}
      """
    Then the response status code is 200
    And the guitar_songs_layout_rows table contains:
      | id   | song_id | position | status |
      | 0700 | 0200    | 2        | active |
      | 0701 | 0200    | 1        | active |

  Scenario: Manager removes a row — it and its columns and blocks are archived
    Given I am authenticated as an administrator: user.id 0001
    When I DELETE /api/features/tasks/guitar-songs/layout/rows/0701
    Then the response status code is 204
    And the guitar_songs_layout_rows table contains:
      | id   | song_id | position | status   |
      | 0700 | 0200    | 1        | active   |
      | 0701 | 0200    | 2        | archived |
    And the guitar_songs_layout_columns table contains:
      | id   | row_id | status   |
      | 0710 | 0700   | active   |
      | 0720 | 0701   | archived |
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | block_type  | status   |
      | 0711 | 0710      | title       | active   |
      | 0721 | 0720      | description | archived |

  Scenario: Manager removes a row holding a Lyrics & Chords block — a mirror pointing into it loses its link, doesn't delete the mirroring block
    Given I am authenticated as an administrator: user.id 0001
    And the guitar_songs_layout_rows table contains:
      | id   | song_id | position | page_break_before | status |
      | 0702 | 0200    | 3        | false              | active |
    And the guitar_songs_layout_columns table contains:
      | id   | row_id | song_id | position | width_twelfths | align | status |
      | 0730 | 0702   | 0200    | 1        | 8              | left  | active |
      | 0733 | 0701   | 0200    | 2        | 4              | left  | active |
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | lyrics_text | linked_to_block_id | status |
      | 0731 | 0730      | 0200    | 1        | sections   | Target text |                     | active |
      | 0732 | 0733      | 0200    | 1        | sections   |             | 0731                | active |
    When I DELETE /api/features/tasks/guitar-songs/layout/rows/0702
    Then the response status code is 204
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | block_type  | status   |
      | 0711 | 0710      | title       | active   |
      | 0721 | 0720      | description | active   |
      | 0732 | 0733      | sections    | active   |
      | 0731 | 0730      | sections    | archived |
    And block 0732 no longer links to a block

  @error_case
  Scenario: Member (not manager) tries to remove a row — 403 error and it stays active
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
    When I DELETE /api/features/tasks/guitar-songs/layout/rows/0701
    Then the response status code is 403
    And the guitar_songs_layout_rows table contains:
      | id   | song_id | position | status |
      | 0700 | 0200    | 1        | active |
      | 0701 | 0200    | 2        | active |
