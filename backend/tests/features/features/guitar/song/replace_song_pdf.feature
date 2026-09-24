Feature: Replace a PDF song's file, and keep the two content modes sealed off from each other
  As a project member
  I want to swap in a corrected PDF for a song still in draft
  So that a mistake in the uploaded sheet doesn't stick around forever

  The song's content mode (free-form layout vs. uploaded PDF) is chosen once at creation and can
  never change afterward -- see create_pdf_song.feature. Only the PDF file itself can be
  replaced, through the same PATCH endpoint as every other song field, so it follows the same
  completed-song lock as title/author/tempo (see update_song.feature) -- unlike labels,
  difficulty, mastery and the draft/completed state itself, which stay editable regardless.

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
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |

  Scenario: PATCH a draft PDF song's file — it is replaced
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs table contains:
      | id   | project_id | title      | content_type | pdf_file_url                       | pdf_file_name | song_state | status |
      | 0200 | 0020       | Wonderwall | pdf          | https://uploads.test/files/old.pdf | old.pdf       | draft      | active |
    When I PATCH /api/features/tasks/guitar-songs/songs/0200 with body:
      """
      {
        "pdf_file_url": "https://uploads.test/files/new.pdf",
        "pdf_file_name": "new.pdf", "pdf_file_size": 99000
      }
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "pdf_file_url": "https://uploads.test/files/new.pdf",
        "pdf_file_name": "new.pdf",
        "pdf_file_size": 99000
      }
      """
    And the guitar_songs table contains:
      | id   | project_id | title      | content_type | pdf_file_url                       | pdf_file_name | song_state | status |
      | 0200 | 0020       | Wonderwall | pdf          | https://uploads.test/files/new.pdf | new.pdf       | draft      | active |

  @error_case
  Scenario: PATCH a completed PDF song's file — 409 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs table contains:
      | id   | project_id | title      | content_type | pdf_file_url                       | pdf_file_name | song_state | status |
      | 0200 | 0020       | Wonderwall | pdf          | https://uploads.test/files/old.pdf | old.pdf       | completed  | active |
    When I PATCH /api/features/tasks/guitar-songs/songs/0200 with body:
      """
      {"pdf_file_url": "https://uploads.test/files/new.pdf", "pdf_file_name": "new.pdf"}
      """
    Then the response status code is 409
    And the guitar_songs table contains:
      | id   | project_id | title      | content_type | pdf_file_url                       | pdf_file_name | song_state | status |
      | 0200 | 0020       | Wonderwall | pdf          | https://uploads.test/files/old.pdf | old.pdf       | completed  | active |

  @error_case
  Scenario: PATCH a layout song's pdf_file_url — 409 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs table contains:
      | id   | project_id | title      | content_type | pdf_file_url | song_state | status |
      | 0200 | 0020       | Wonderwall | layout       |              | draft      | active |
    When I PATCH /api/features/tasks/guitar-songs/songs/0200 with body:
      """
      {"pdf_file_url": "https://uploads.test/files/new.pdf", "pdf_file_name": "new.pdf"}
      """
    Then the response status code is 409
    And the guitar_songs table contains:
      | id   | project_id | title      | content_type | pdf_file_url | song_state | status |
      | 0200 | 0020       | Wonderwall | layout       |              | draft      | active |

  @error_case
  Scenario: POST a layout row on a PDF song — 409 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs table contains:
      | id   | project_id | title      | content_type | pdf_file_url                       | song_state | status |
      | 0200 | 0020       | Wonderwall | pdf          | https://uploads.test/files/old.pdf | draft      | active |
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows with body:
      """
      {"page_break_before": false, "columns": [{"width_twelfths": 12, "align": "left", "blocks": [{"block_type": "title"}]}]}
      """
    Then the response status code is 409
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |

  @error_case
  Scenario: GET the rendered layout PDF for a PDF song — 409, there is no layout to render
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs table contains:
      | id   | project_id | title      | content_type | pdf_file_url                       | song_state | status |
      | 0200 | 0020       | Wonderwall | pdf          | https://uploads.test/files/old.pdf | draft      | active |
    When I GET /api/features/tasks/guitar-songs/songs/0200/layout/pdf
    Then the response status code is 409

  Scenario: PUT a completed PDF song's own mastery rating — still editable, unlike the PDF file itself
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs table contains:
      | id   | project_id | title      | content_type | pdf_file_url                       | song_state | status |
      | 0200 | 0020       | Wonderwall | pdf          | https://uploads.test/files/old.pdf | completed  | active |
    When I PUT /api/features/tasks/guitar-songs/songs/0200/mastery with body:
      """
      {"mastery_level": 3}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {"my_mastery": 3}
      """
