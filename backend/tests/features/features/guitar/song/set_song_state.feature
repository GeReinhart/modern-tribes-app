Feature: Set a guitar song's editorial state (draft / completed)
  As a project member
  I want to mark a song as completed once it's ready, and reopen it as a draft if I need to fix it
  So that finished songs stop being edited by accident while still staying viewable

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

  Scenario: PATCH song_state from draft to completed as a member — it succeeds
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs table contains:
      | id   | project_id | title      | author | song_state | status |
      | 0200 | 0020       | Wonderwall | Oasis  | draft      | active |
    When I PATCH /api/features/tasks/guitar-songs/songs/0200 with body:
      """
      {"song_state": "completed"}
      """
    Then the response status code is 200
    And the guitar_songs table contains:
      | id   | project_id | title      | author | song_state | status |
      | 0200 | 0020       | Wonderwall | Oasis  | completed  | active |

  Scenario: PATCH song_state from completed back to draft as a member — it succeeds
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs table contains:
      | id   | project_id | title      | author | song_state | status |
      | 0200 | 0020       | Wonderwall | Oasis  | completed  | active |
    When I PATCH /api/features/tasks/guitar-songs/songs/0200 with body:
      """
      {"song_state": "draft"}
      """
    Then the response status code is 200
    And the guitar_songs table contains:
      | id   | project_id | title      | author | song_state | status |
      | 0200 | 0020       | Wonderwall | Oasis  | draft      | active |

  @error_case
  Scenario: PATCH a content field (title) on a completed song — 409 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs table contains:
      | id   | project_id | title      | author | song_state | status |
      | 0200 | 0020       | Wonderwall | Oasis  | completed  | active |
    When I PATCH /api/features/tasks/guitar-songs/songs/0200 with body:
      """
      {"title": "Wonderwall (acoustic)"}
      """
    Then the response status code is 409
    And the guitar_songs table contains:
      | id   | project_id | title      | author | song_state | status |
      | 0200 | 0020       | Wonderwall | Oasis  | completed  | active |

  @error_case
  Scenario: PATCH song_state together with a content field on a completed song — 409 error, nothing changes
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs table contains:
      | id   | project_id | title      | author | song_state | status |
      | 0200 | 0020       | Wonderwall | Oasis  | completed  | active |
    When I PATCH /api/features/tasks/guitar-songs/songs/0200 with body:
      """
      {"song_state": "draft", "title": "Wonderwall (acoustic)"}
      """
    Then the response status code is 409
    And the guitar_songs table contains:
      | id   | project_id | title      | author | song_state | status |
      | 0200 | 0020       | Wonderwall | Oasis  | completed  | active |

  @error_case
  Scenario: POST a new layout row on a completed song — 409 error and the layout is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs table contains:
      | id   | project_id | title      | author | song_state | status |
      | 0200 | 0020       | Wonderwall | Oasis  | completed  | active |
    And the guitar_songs_layout_rows table contains:
      | id   | song_id | position | status |
      | 0300 | 0200    | 1        | active |
    When I POST /api/features/tasks/guitar-songs/songs/0200/layout/rows with body:
      """
      {"columns": [{"width_twelfths": 12}]}
      """
    Then the response status code is 409
    And the guitar_songs_layout_rows table contains:
      | id   | song_id | position | status |
      | 0300 | 0200    | 1        | active |

  Scenario: Attach a label to a completed song — it succeeds even though the song is completed
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs table contains:
      | id   | project_id | title      | author | song_state | status |
      | 0200 | 0020       | Wonderwall | Oasis  | completed  | active |
    And the labels table contains:
      | id   | project_id | name     | color   | status |
      | 0400 | 0020       | Setlist  | #6b7280 | active |
    And the label_entities table contains:
      | label_id | entity_type  | entity_id |
    When I POST /api/features/tasks/guitar-songs/songs/0200/labels/0400
    Then the response status code is 204
    And the label_entities table contains:
      | label_id | entity_type  | entity_id |
      | 0400     | guitar_song  | 0200      |

  Scenario: Detach a label from a completed song — it succeeds even though the song is completed
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs table contains:
      | id   | project_id | title      | author | song_state | status |
      | 0200 | 0020       | Wonderwall | Oasis  | completed  | active |
    And the labels table contains:
      | id   | project_id | name     | color   | status |
      | 0400 | 0020       | Setlist  | #6b7280 | active |
    And the label_entities table contains:
      | label_id | entity_type  | entity_id |
      | 0400     | guitar_song  | 0200      |
    When I DELETE /api/features/tasks/guitar-songs/songs/0200/labels/0400
    Then the response status code is 204
    And the label_entities table contains:
      | label_id | entity_type  | entity_id |

  Scenario: Archive a completed song — it succeeds even though the song is completed
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | manager  | active |
    And the guitar_songs table contains:
      | id   | project_id | title      | author | song_state | status |
      | 0200 | 0020       | Wonderwall | Oasis  | completed  | active |
    When I DELETE /api/features/tasks/guitar-songs/songs/0200
    Then the response status code is 204
    And the guitar_songs table contains:
      | id   | project_id | title      | author | song_state | status   |
      | 0200 | 0020       | Wonderwall | Oasis  | completed  | archived |

  @error_case
  Scenario: PATCH song_state as a guest — 403 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | guest    | active |
    And the guitar_songs table contains:
      | id   | project_id | title      | author | song_state | status |
      | 0200 | 0020       | Wonderwall | Oasis  | draft      | active |
    When I PATCH /api/features/tasks/guitar-songs/songs/0200 with body:
      """
      {"song_state": "completed"}
      """
    Then the response status code is 403
    And the guitar_songs table contains:
      | id   | project_id | title      | author | song_state | status |
      | 0200 | 0020       | Wonderwall | Oasis  | draft      | active |

  @error_case
  Scenario: PATCH song_state with an invalid value — 422 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs table contains:
      | id   | project_id | title      | author | song_state | status |
      | 0200 | 0020       | Wonderwall | Oasis  | draft      | active |
    When I PATCH /api/features/tasks/guitar-songs/songs/0200 with body:
      """
      {"song_state": "finished"}
      """
    Then the response status code is 422
    And the guitar_songs table contains:
      | id   | project_id | title      | author | song_state | status |
      | 0200 | 0020       | Wonderwall | Oasis  | draft      | active |
