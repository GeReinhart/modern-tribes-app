Feature: Download a guitar song as a printable PDF
  As a project member
  I want to download a song laid out per its presentation template
  So that I can print it for a rehearsal

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
    And the guitar_songs_layout_settings table contains:
      | id   | song_id | status |
      | 0900 | 0200    | active |
    And the guitar_songs_layout_rows table contains:
      | id   | song_id | position | page_break_before | status |
      | 0700 | 0200    | 1        | false              | active |
    And the guitar_songs_layout_columns table contains:
      | id   | row_id | song_id | position | width_eighths | align | status |
      | 0710 | 0700   | 0200    | 1        | 8              | left  | active |
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | status |
      | 0711 | 0710      | 0200    | 1        | title      | active |

  Scenario: GET the PDF as a project guest — a valid PDF is returned
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1002 | 0010     | 0030      | guest    | active |
    When I GET /api/features/tasks/guitar-songs/songs/0200/layout/pdf
    Then the response status code is 200
    And the response content type is "application/pdf"
    And the response body is a valid PDF

  @error_case
  Scenario: GET the PDF as an outsider — 403
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tasks/guitar-songs/songs/0200/layout/pdf
    Then the response status code is 403

  Scenario: GET the PDF twice with no changes — the second call reuses the cached copy
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1002 | 0010     | 0030      | guest    | active |
    When I GET /api/features/tasks/guitar-songs/songs/0200/layout/pdf
    Then the response status code is 200
    And the guitar_songs_layout_pdf_cache table has a cached entry for song 0200
    When I GET the same URL again
    Then the response status code is 200
    And the response body is byte-identical to the previous response
