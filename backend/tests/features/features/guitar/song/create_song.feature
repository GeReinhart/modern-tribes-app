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
