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
      | id   | row_id | song_id | position | width_eighths | align | status |
      | 0710 | 0700   | 0200    | 1        | 8              | left  | active |
    And the documents table contains:
      | id   | content_html      | status |
      | 0900 | <p>Old notes</p>  | active |
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | width_eighths | custom_title | custom_document_id | status |
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

  @error_case
  Scenario: PATCH the content of a non-custom block — 409 and nothing changes
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | width_eighths | status |
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
