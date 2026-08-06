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
      | id   | row_id | song_id | position | width_eighths | align | status |
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
          {"blocks": [{"block_type": "author"}], "width_eighths": 3, "align": "center"},
          {"blocks": [{"block_type": "tempo"}, {"block_type": "time_signature"}, {"block_type": "capo"}], "width_eighths": 5, "align": "right"}
        ]
      }
      """
    Then the response status code is 200
    And the guitar_songs_layout_rows table contains:
      | id   | song_id | position | page_break_before | status |
      | 0700 | 0200    | 1        | true               | active |
      | 0701 | 0200    | 2        | false              | active |
    And the guitar_songs_layout_columns table contains:
      | row_id | width_eighths | align  | status   |
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
          {"blocks": [{"block_type": "author"}], "width_eighths": 4, "align": "left"},
          {"blocks": [], "width_eighths": 2, "align": "left"}
        ]
      }
      """
    Then the response status code is 200
    And the guitar_songs_layout_columns table contains:
      | row_id | width_eighths | align | status   |
      | 0700   | 8              | left  | archived |
      | 0700   | 4              | left  | active   |
      | 0700   | 2              | left  | active   |
      | 0701   | 8              | left  | active   |
    And the guitar_songs_layout_column_blocks table contains:
      | block_type     | status   |
      | title          | archived |
      | author         | active   |
      | description    | active   |

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
