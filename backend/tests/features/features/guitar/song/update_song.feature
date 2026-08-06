Feature: Update a guitar song
  As a project member
  I want to edit a song's details and description
  So that I can fix mistakes and add practice notes

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

  Scenario: PATCH a song's tempo — it is updated
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs table contains:
      | id   | project_id | title      | author | tempo_bpm | beats_per_bar | capo | status |
      | 0200 | 0020       | Wonderwall | Oasis  | 87        | 4             | 2    | active |
    When I PATCH /api/features/tasks/guitar-songs/songs/0200 with body:
      """
      {"tempo_bpm": 90}
      """
    Then the response status code is 200
    And the guitar_songs table contains:
      | id   | project_id | title      | author | tempo_bpm | beats_per_bar | capo | status |
      | 0200 | 0020       | Wonderwall | Oasis  | 90        | 4             | 2    | active |

  Scenario: PATCH a song's lyrics presentation settings — they are updated
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs table contains:
      | id   | project_id | title      | author | tempo_bpm | beats_per_bar | capo | status |
      | 0200 | 0020       | Wonderwall | Oasis  | 87        | 4             | 2    | active |
    When I PATCH /api/features/tasks/guitar-songs/songs/0200 with body:
      """
      {"lyrics_line_spacing_px": 20, "lyrics_text_size_px": 24, "lyrics_chord_size_px": 26}
      """
    Then the response status code is 200
    And the guitar_songs table contains:
      | id   | project_id | title      | author | tempo_bpm | beats_per_bar | capo | lyrics_line_spacing_px | lyrics_text_size_px | lyrics_chord_size_px | status |
      | 0200 | 0020       | Wonderwall | Oasis  | 87        | 4             | 2    | 20                     | 24                   | 26                    | active |

  @error_case
  Scenario: PATCH a song's lyrics chord size out of range — 422 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs table contains:
      | id   | project_id | title      | author | tempo_bpm | beats_per_bar | capo | status |
      | 0200 | 0020       | Wonderwall | Oasis  | 87        | 4             | 2    | active |
    When I PATCH /api/features/tasks/guitar-songs/songs/0200 with body:
      """
      {"lyrics_chord_size_px": 100}
      """
    Then the response status code is 422
    And the guitar_songs table contains:
      | id   | project_id | title      | author | tempo_bpm | beats_per_bar | capo | status |
      | 0200 | 0020       | Wonderwall | Oasis  | 87        | 4             | 2    | active |

  Scenario: PATCH a description onto a song with none yet — a document is created and linked
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs table contains:
      | id   | project_id | title      | author | tempo_bpm | beats_per_bar | capo | status |
      | 0200 | 0020       | Wonderwall | Oasis  | 87        | 4             | 2    | active |
    And the documents table contains:
      | id | content_html | status |
    When I PATCH /api/features/tasks/guitar-songs/songs/0200 with body:
      """
      {"description_html": "<p>Capo 2, strum softly.</p>"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "description_html": "<p>Capo 2, strum softly.</p>"
      }
      """
    And the documents table contains:
      | content_html                    | status |
      | <p>Capo 2, strum softly.</p>     | active |

  Scenario: PATCH a description onto a song that already has one — the existing document is revised
    Given I am authenticated as a regular user: user.id 0002
    And the documents table contains:
      | id   | content_html          | status |
      | 0500 | <p>Old notes.</p>     | active |
    And the guitar_songs table contains:
      | id   | project_id | title      | author | tempo_bpm | beats_per_bar | capo | document_id | status |
      | 0200 | 0020       | Wonderwall | Oasis  | 87        | 4             | 2    | 0500        | active |
    When I PATCH /api/features/tasks/guitar-songs/songs/0200 with body:
      """
      {"description_html": "<p>New notes.</p>"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "description_html": "<p>New notes.</p>"
      }
      """
    And the documents table contains:
      | id   | content_html          | status |
      | 0500 | <p>New notes.</p>     | active |

  @error_case
  Scenario: PATCH a song's tempo out of range — 422 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs table contains:
      | id   | project_id | title      | author | tempo_bpm | beats_per_bar | capo | status |
      | 0200 | 0020       | Wonderwall | Oasis  | 87        | 4             | 2    | active |
    When I PATCH /api/features/tasks/guitar-songs/songs/0200 with body:
      """
      {"tempo_bpm": 500}
      """
    Then the response status code is 422
    And the guitar_songs table contains:
      | id   | project_id | title      | author | tempo_bpm | beats_per_bar | capo | status |
      | 0200 | 0020       | Wonderwall | Oasis  | 87        | 4             | 2    | active |
