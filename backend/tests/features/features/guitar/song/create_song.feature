Feature: Create a guitar song
  As a project member
  I want to add a new song to the project's shared songbook
  So that the whole tribe can practice it together with the right tempo

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

  Scenario: POST a song as a project member — the song is created with defaults
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
      | id | project_id | title | author | tempo_bpm | beats_per_bar | capo | status |
    When I POST /api/features/tasks/guitar-songs/projects/0020/songs with body:
      """
      {"title": "Wonderwall", "author": "Oasis", "tempo_bpm": 87, "beats_per_bar": 4, "capo": 2}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "title": "Wonderwall",
        "author": "Oasis",
        "tempo_bpm": 87,
        "beats_per_bar": 4,
        "capo": 2,
        "status": "active"
      }
      """
    And the guitar_songs table contains:
      | project_id | title      | author | tempo_bpm | beats_per_bar | capo | status |
      | 0020       | Wonderwall | Oasis  | 87        | 4             | 2    | active |

  Scenario: POST a song without a capo — it defaults to 0
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
      | id | project_id | title | author | tempo_bpm | beats_per_bar | capo | status |
    When I POST /api/features/tasks/guitar-songs/projects/0020/songs with body:
      """
      {"title": "Ho Hey", "author": "The Lumineers", "tempo_bpm": 138, "beats_per_bar": 4}
      """
    Then the response status code is 201
    And the guitar_songs table contains:
      | project_id | title  | author         | tempo_bpm | beats_per_bar | capo | status |
      | 0020       | Ho Hey | The Lumineers  | 138       | 4              | 0    | active |

  Scenario: POST a song with a chord diagram style and size — they are saved
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
      | id | project_id | title | author | tempo_bpm | beats_per_bar | capo | status |
    When I POST /api/features/tasks/guitar-songs/projects/0020/songs with body:
      """
      {"title": "Zombie", "author": "The Cranberries", "tempo_bpm": 84, "beats_per_bar": 4, "chord_diagram_style": "simple", "chord_diagram_size": "large"}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "chord_diagram_style": "simple",
        "chord_diagram_size": "large"
      }
      """

  Scenario: POST a song with lyrics presentation settings — they are saved
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
      | id | project_id | title | author | tempo_bpm | beats_per_bar | capo | status |
    When I POST /api/features/tasks/guitar-songs/projects/0020/songs with body:
      """
      {"title": "Zombie", "author": "The Cranberries", "tempo_bpm": 84, "beats_per_bar": 4, "lyrics_line_spacing_px": 14, "lyrics_text_size_px": 20, "lyrics_chord_size_px": 22}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "lyrics_line_spacing_px": 14,
        "lyrics_text_size_px": 20,
        "lyrics_chord_size_px": 22
      }
      """

  Scenario: POST a song without lyrics presentation settings — they default to 10/16/18
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
      | id | project_id | title | author | tempo_bpm | beats_per_bar | capo | status |
    When I POST /api/features/tasks/guitar-songs/projects/0020/songs with body:
      """
      {"title": "Ho Hey", "author": "The Lumineers", "tempo_bpm": 138, "beats_per_bar": 4}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "lyrics_line_spacing_px": 10,
        "lyrics_text_size_px": 16,
        "lyrics_chord_size_px": 18
      }
      """

  @error_case
  Scenario: POST a song with a lyrics text size out of range — 422 error and the database is not modified
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
      | id | project_id | title | author | tempo_bpm | beats_per_bar | capo | status |
    When I POST /api/features/tasks/guitar-songs/projects/0020/songs with body:
      """
      {"title": "Zombie", "author": "The Cranberries", "tempo_bpm": 84, "beats_per_bar": 4, "lyrics_text_size_px": 100}
      """
    Then the response status code is 422
    And the guitar_songs table contains:
      | id | project_id | title | author | tempo_bpm | beats_per_bar | capo | status |

  Scenario: POST a song with a description — a document is created for it
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
      | id | project_id | title | author | tempo_bpm | beats_per_bar | capo | status |
    And the documents table contains:
      | id | content_html | status |
    When I POST /api/features/tasks/guitar-songs/projects/0020/songs with body:
      """
      {"title": "Zombie", "author": "The Cranberries", "tempo_bpm": 84, "beats_per_bar": 4, "description_html": "<p>Play the intro softly.</p>"}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "description_html": "<p>Play the intro softly.</p>"
      }
      """
    And the documents table contains:
      | content_html                  | status |
      | <p>Play the intro softly.</p> | active |

  Scenario: POST a song without a description — no document is created
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
      | id | project_id | title | author | tempo_bpm | beats_per_bar | capo | status |
    And the documents table contains:
      | id | content_html | status |
    When I POST /api/features/tasks/guitar-songs/projects/0020/songs with body:
      """
      {"title": "Ho Hey", "author": "The Lumineers", "tempo_bpm": 138, "beats_per_bar": 4}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "description_html": ""
      }
      """
    And the documents table contains:
      | id | content_html | status |

  @error_case
  Scenario: POST a song with an invalid chord diagram style — 422 error and the database is not modified
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
      | id | project_id | title | author | tempo_bpm | beats_per_bar | capo | status |
    When I POST /api/features/tasks/guitar-songs/projects/0020/songs with body:
      """
      {"title": "Zombie", "author": "The Cranberries", "tempo_bpm": 84, "beats_per_bar": 4, "chord_diagram_style": "psychedelic"}
      """
    Then the response status code is 422
    And the guitar_songs table contains:
      | id | project_id | title | author | tempo_bpm | beats_per_bar | capo | status |

  @error_case
  Scenario: POST a song as a project guest — 403 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the persons table contains:
      | id   | first_name | last_name | status |
      | 0030 | Gus        | Guest     | active |
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
      | 1001 | 0010     | 0030      | guest    | active |
    And the guitar_songs table contains:
      | id | project_id | title | author | tempo_bpm | beats_per_bar | capo | status |
    When I POST /api/features/tasks/guitar-songs/projects/0020/songs with body:
      """
      {"title": "Wonderwall", "author": "Oasis", "tempo_bpm": 87, "beats_per_bar": 4}
      """
    Then the response status code is 403
    And the guitar_songs table contains:
      | id | project_id | title | author | tempo_bpm | beats_per_bar | capo | status |

  @error_case
  Scenario: POST a song with a tempo out of range — 422 error and the database is not modified
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
      | id | project_id | title | author | tempo_bpm | beats_per_bar | capo | status |
    When I POST /api/features/tasks/guitar-songs/projects/0020/songs with body:
      """
      {"title": "Too Fast", "author": "Nobody", "tempo_bpm": 500, "beats_per_bar": 4}
      """
    Then the response status code is 422
    And the guitar_songs table contains:
      | id | project_id | title | author | tempo_bpm | beats_per_bar | capo | status |

  @error_case
  Scenario: POST a song with a beats_per_bar out of range — 422 error and the database is not modified
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
      | id | project_id | title | author | tempo_bpm | beats_per_bar | capo | status |
    When I POST /api/features/tasks/guitar-songs/projects/0020/songs with body:
      """
      {"title": "Odd Meter", "author": "Nobody", "tempo_bpm": 100, "beats_per_bar": 12}
      """
    Then the response status code is 422
    And the guitar_songs table contains:
      | id | project_id | title | author | tempo_bpm | beats_per_bar | capo | status |

  @error_case
  Scenario: POST a song with a capo out of range — 422 error and the database is not modified
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
      | id | project_id | title | author | tempo_bpm | beats_per_bar | capo | status |
    When I POST /api/features/tasks/guitar-songs/projects/0020/songs with body:
      """
      {"title": "Way Too Capo'd", "author": "Nobody", "tempo_bpm": 100, "beats_per_bar": 4, "capo": 20}
      """
    Then the response status code is 422
    And the guitar_songs table contains:
      | id | project_id | title | author | tempo_bpm | beats_per_bar | capo | status |

  Scenario: POST a song — it is seeded with the default presentation layout template
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
      | id | project_id | title | author | tempo_bpm | beats_per_bar | capo | status |
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |
    When I POST /api/features/tasks/guitar-songs/projects/0020/songs with body:
      """
      {"title": "Wonderwall", "author": "Oasis", "tempo_bpm": 87, "beats_per_bar": 4}
      """
    Then the response status code is 201
    And the guitar_songs_layout_rows table contains:
      | position | page_break_before | status |
      | 1        | false              | active |
      | 2        | false              | active |
      | 3        | false              | active |
      | 4        | false              | active |
      | 5        | false              | active |
      | 6        | false              | active |
    And the guitar_songs_layout_columns table contains:
      | position | width_eighths | align | status |
      | 1        | 8              | left  | active |
      | 1        | 2              | left  | active |
      | 2        | 6              | left  | active |
      | 1        | 8              | left  | active |
      | 1        | 8              | left  | active |
      | 1        | 8              | left  | active |
      | 1        | 8              | left  | active |
    And the guitar_songs_layout_column_blocks table contains:
      | position | block_type     | status |
      | 1        | title          | active |
      | 1        | author         | active |
      | 1        | tempo          | active |
      | 2        | time_signature | active |
      | 3        | capo           | active |
      | 1        | description    | active |
      | 1        | chords         | active |
      | 1        | sections       | active |
      | 1        | videos         | active |

  Scenario: POST a song with blank_layout — no rows are seeded, ready to be built from scratch
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
      | id | project_id | title | author | tempo_bpm | beats_per_bar | capo | status |
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |
    When I POST /api/features/tasks/guitar-songs/projects/0020/songs with body:
      """
      {"title": "Wonderwall", "author": "Oasis", "blank_layout": true}
      """
    Then the response status code is 201
    And the guitar_songs_layout_rows table contains:
      | id | song_id | position | page_break_before | status |

  Scenario: POST a song with a template_song_id — the template's layout is copied instead of the default
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
      | 0201 | 0020       | Wonderwall | Oasis  | active |
    And the guitar_songs_layout_settings table contains:
      | id   | song_id | margin_top_mm | status |
      | 0910 | 0201    | 20.0           | active |
    And the guitar_songs_layout_rows table contains:
      | id   | song_id | position | page_break_before | status |
      | 0710 | 0201    | 1        | true               | active |
    And the guitar_songs_layout_columns table contains:
      | id   | row_id | song_id | position | width_eighths | align | status |
      | 0720 | 0710   | 0201    | 1        | 8              | left  | active |
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | status |
      | 0730 | 0720      | 0201    | 1        | title      | active |
    When I POST /api/features/tasks/guitar-songs/projects/0020/songs with body:
      """
      {"title": "New Song", "template_song_id": "0201"}
      """
    Then the response status code is 201
    And the guitar_songs_layout_settings table contains:
      | margin_top_mm | status |
      | 20.0           | active |
      | 20.0           | active |
    And the guitar_songs_layout_rows table contains:
      | position | page_break_before | status |
      | 1        | true               | active |
      | 1        | true               | active |
    And the guitar_songs_layout_column_blocks table contains:
      | position | block_type | status |
      | 1        | title      | active |
      | 1        | title      | active |

  Scenario: POST a song with a copy_from_song_id — content and layout are copied, but title/author stay the request's own
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
      | id   | project_id | title      | author | tempo_bpm | beats_per_bar | capo | chord_diagram_style | chord_diagram_size | status |
      | 0203 | 0020       | Wonderwall | Oasis  | 87        | 4              | 2    | simple               | large               | active |
    And the guitar_chords table contains:
      | id   | name | root_note | frets         | status |
      | 0301 | Em7  | E         | [0,2,0,0,0,0] | active |
    And the guitar_songs_chords table contains:
      | id   | song_id | chord_id | position | comment     | status |
      | 0701 | 0203    | 0301     | 1        | Play softly | active |
    And the guitar_songs_videos table contains:
      | id   | song_id | title       | url                            | position | status |
      | 0711 | 0203    | Live at BBC | https://example.com/video.mp4 | 1        | active |
    And the guitar_songs_sections table contains:
      | id   | song_id | position | type_label | content_mode | lyrics_text | status |
      | 0721 | 0203    | 1        | Couplet    | lyrics       | Twinkle     | active |
    And the guitar_songs_layout_settings table contains:
      | id   | song_id | status |
      | 0731 | 0203    | active |
    And the guitar_songs_layout_rows table contains:
      | id   | song_id | position | page_break_before | status |
      | 0741 | 0203    | 1        | false              | active |
    And the guitar_songs_layout_columns table contains:
      | id   | row_id | song_id | position | width_eighths | align | status |
      | 0751 | 0741   | 0203    | 1        | 8              | left  | active |
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | status |
      | 0761 | 0751      | 0203    | 1        | title      | active |
    When I POST /api/features/tasks/guitar-songs/projects/0020/songs with body:
      """
      {"title": "Wonderwall - Cover", "author": "My Band", "copy_from_song_id": "0203"}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "title": "Wonderwall - Cover",
        "author": "My Band",
        "tempo_bpm": 87,
        "beats_per_bar": 4,
        "capo": 2,
        "chord_diagram_style": "simple",
        "chord_diagram_size": "large"
      }
      """
    And the guitar_songs table contains:
      | project_id | title              | author  | tempo_bpm | beats_per_bar | capo | chord_diagram_style | chord_diagram_size | status |
      | 0020       | Wonderwall         | Oasis   | 87        | 4              | 2    | simple               | large               | active |
      | 0020       | Wonderwall - Cover | My Band | 87        | 4              | 2    | simple               | large               | active |
    And the guitar_songs_chords table contains:
      | chord_id | position | comment     | status |
      | 0301     | 1        | Play softly | active |
      | 0301     | 1        | Play softly | active |
    And the guitar_songs_videos table contains:
      | title       | url                            | position | status |
      | Live at BBC | https://example.com/video.mp4 | 1        | active |
      | Live at BBC | https://example.com/video.mp4 | 1        | active |
    And the guitar_songs_sections table contains:
      | position | type_label | content_mode | lyrics_text | status |
      | 1        | Couplet    | lyrics       | Twinkle     | active |
      | 1        | Couplet    | lyrics       | Twinkle     | active |
    And the guitar_songs_layout_column_blocks table contains:
      | block_type | status |
      | title      | active |
      | title      | active |

  @error_case
  Scenario: POST a song with a copy_from_song_id from another project — 404 and no song is created
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
    And the projects table contains:
      | id   | name      | status |
      | 0020 | Rehearsal | active |
      | 0021 | Other     | active |
    And the tribes_projects table contains:
      | tribe_id | project_id | relation |
      | 0010     | 0020       | manager  |
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs table contains:
      | id   | project_id | title      | author | status |
      | 0204 | 0021       | Other Song | Nobody | active |
    When I POST /api/features/tasks/guitar-songs/projects/0020/songs with body:
      """
      {"title": "New Song", "copy_from_song_id": "0204"}
      """
    Then the response status code is 404
    And the guitar_songs table contains:
      | id   | project_id | title      | author | status |
      | 0204 | 0021       | Other Song | Nobody | active |

  @error_case
  Scenario: POST a song with a template_song_id from another project — 404 and no song is created
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
    And the projects table contains:
      | id   | name      | status |
      | 0020 | Rehearsal | active |
      | 0021 | Other     | active |
    And the tribes_projects table contains:
      | tribe_id | project_id | relation |
      | 0010     | 0020       | manager  |
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs table contains:
      | id   | project_id | title       | author | status |
      | 0202 | 0021       | Other Song  | Nobody | active |
    When I POST /api/features/tasks/guitar-songs/projects/0020/songs with body:
      """
      {"title": "New Song", "template_song_id": "0202"}
      """
    Then the response status code is 404
    And the guitar_songs table contains:
      | id   | project_id | title       | author | status |
      | 0202 | 0021       | Other Song  | Nobody | active |
