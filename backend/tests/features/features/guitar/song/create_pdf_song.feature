Feature: Create a guitar song as a PDF file instead of a free-form layout
  As a project member
  I want to add a song to the songbook as a single uploaded PDF
  So that I can keep an existing sheet (scanned or exported elsewhere) without rebuilding it block by block

  A song's content mode -- free-form layout vs. a single uploaded PDF -- is chosen once, at
  creation, and never changes afterward. Labels, difficulty, mastery and the draft/completed
  state are ordinary metadata, independent of the content mode, and work exactly the same for a
  PDF song as for a layout song (see set_song_difficulty.feature, set_song_state.feature,
  mastery/*.feature and labels/*.feature -- nothing about those changes here).

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

  Scenario: POST a song with content_type "pdf" and a file — it is created with no layout seeded
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs table contains:
      | id | project_id | title | content_type | pdf_file_url | pdf_file_name | status |
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |
    When I POST /api/features/tasks/guitar-songs/projects/0020/songs with body:
      """
      {
        "title": "Wonderwall", "author": "Oasis", "content_type": "pdf",
        "pdf_file_url": "https://uploads.test/files/wonderwall.pdf",
        "pdf_file_name": "wonderwall.pdf", "pdf_file_size": 245678
      }
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "content_type": "pdf",
        "pdf_file_url": "https://uploads.test/files/wonderwall.pdf",
        "pdf_file_name": "wonderwall.pdf",
        "pdf_file_size": 245678
      }
      """
    And the guitar_songs table contains:
      | project_id | title      | content_type | pdf_file_url                              | pdf_file_name  | status |
      | 0020       | Wonderwall | pdf          | https://uploads.test/files/wonderwall.pdf | wonderwall.pdf | active |
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |

  Scenario: POST a song without content_type — it defaults to "layout" with the usual seeded template
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs table contains:
      | id | project_id | title | content_type | status |
    When I POST /api/features/tasks/guitar-songs/projects/0020/songs with body:
      """
      {"title": "Wonderwall", "author": "Oasis"}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "content_type": "layout",
        "pdf_file_url": null
      }
      """
    And the guitar_songs table contains:
      | project_id | title      | content_type | status |
      | 0020       | Wonderwall | layout       | active |

  Scenario: POST a song with copy_from_song_id from a PDF song — the copy is also a PDF song, with its own file reference
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs table contains:
      | id   | project_id | title      | content_type | pdf_file_url                              | pdf_file_name  | status |
      | 0205 | 0020       | Wonderwall | pdf          | https://uploads.test/files/wonderwall.pdf | wonderwall.pdf | active |
    When I POST /api/features/tasks/guitar-songs/projects/0020/songs with body:
      """
      {"title": "Wonderwall - Cover", "author": "My Band", "copy_from_song_id": "0205"}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "content_type": "pdf",
        "pdf_file_url": "https://uploads.test/files/wonderwall.pdf",
        "pdf_file_name": "wonderwall.pdf"
      }
      """
    And the guitar_songs table contains:
      | project_id | title              | content_type | pdf_file_url                              | status |
      | 0020       | Wonderwall         | pdf          | https://uploads.test/files/wonderwall.pdf | active |
      | 0020       | Wonderwall - Cover | pdf          | https://uploads.test/files/wonderwall.pdf | active |

  @error_case
  Scenario: POST a song with content_type "pdf" but no file — 422 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs table contains:
      | id | project_id | title | content_type | status |
    When I POST /api/features/tasks/guitar-songs/projects/0020/songs with body:
      """
      {"title": "Wonderwall", "author": "Oasis", "content_type": "pdf"}
      """
    Then the response status code is 422
    And the guitar_songs table contains:
      | id | project_id | title | content_type | status |

  @error_case
  Scenario: POST a song with content_type "pdf" and a template_song_id — 422 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs table contains:
      | id   | project_id | title    | content_type | status |
      | 0201 | 0020       | Template | layout       | active |
    When I POST /api/features/tasks/guitar-songs/projects/0020/songs with body:
      """
      {
        "title": "Wonderwall", "content_type": "pdf", "template_song_id": "0201",
        "pdf_file_url": "https://uploads.test/files/wonderwall.pdf", "pdf_file_name": "wonderwall.pdf"
      }
      """
    Then the response status code is 422
    And the guitar_songs table contains:
      | id   | project_id | title    | content_type | status |
      | 0201 | 0020       | Template | layout       | active |

  @error_case
  Scenario: POST a song with content_type "pdf" and blank_layout — 422 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs table contains:
      | id | project_id | title | content_type | status |
    When I POST /api/features/tasks/guitar-songs/projects/0020/songs with body:
      """
      {
        "title": "Wonderwall", "content_type": "pdf", "blank_layout": true,
        "pdf_file_url": "https://uploads.test/files/wonderwall.pdf", "pdf_file_name": "wonderwall.pdf"
      }
      """
    Then the response status code is 422
    And the guitar_songs table contains:
      | id | project_id | title | content_type | status |
