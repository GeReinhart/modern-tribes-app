Feature: Manage a project's guitar song labels
  As a project manager
  I want to create labels for the songbook and apply them to songs
  So that the band can organize songs (e.g. "set list", "needs practice") across every song tab

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

  Scenario: Manager creates a song label for the project
    Given I am authenticated as an administrator: user.id 0001
    And the labels table contains:
      | id | project_id | name | color | status |
    When I POST /api/features/tasks/guitar-songs/projects/0020/song-labels with body:
      """
      {"name": "Set list", "color": "#22c55e"}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {"name": "Set list", "color": "#22c55e", "position": 0}
      """
    And the labels table contains:
      | project_id | name     | color   | status |
      | 0020       | Set list | #22c55e | active |

  Scenario: GET a project's song labels — only its own labels are listed
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
      | 1001 | 0010     | 0030      | guest    | active |
    And the labels table contains:
      | id   | project_id | name     | color   | status |
      | 0900 | 0020       | Set list | #22c55e | active |
    When I GET /api/features/tasks/guitar-songs/projects/0020/song-labels
    Then the response status code is 200
    And the response body includes:
      """
      [{"id": "0900", "name": "Set list", "color": "#22c55e"}]
      """

  Scenario: Member attaches a label to a song — it appears in the song's label_ids
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
    And the labels table contains:
      | id   | project_id | name     | color   | status |
      | 0900 | 0020       | Set list | #22c55e | active |
    When I POST /api/features/tasks/guitar-songs/songs/0200/labels/0900
    Then the response status code is 204

  Scenario: Manager deletes a label that is still attached to a song — it succeeds and the attachment is removed too
    Given I am authenticated as an administrator: user.id 0001
    And the labels table contains:
      | id   | project_id | name     | color   | status |
      | 0900 | 0020       | Set list | #22c55e | active |
    And the label_entities table contains:
      | label_id | entity_type  | entity_id |
      | 0900     | guitar_song  | 0200      |
    When I DELETE /api/features/tasks/guitar-songs/song-labels/0900
    Then the response status code is 204
    And the labels table contains:
      | id | project_id | name | color | status |
    And the label_entities table contains:
      | label_id | entity_type  | entity_id |

  Scenario: Manager reorders a project's song labels
    Given I am authenticated as an administrator: user.id 0001
    And the labels table contains:
      | id   | project_id | name     | color   | position | status |
      | 0900 | 0020       | Set list | #22c55e | 0        | active |
      | 0901 | 0020       | Practice | #f97316 | 1        | active |
      | 0902 | 0020       | Ballad   | #3b82f6 | 2        | active |
    When I PUT /api/features/tasks/guitar-songs/projects/0020/song-labels/reorder with body:
      """
      {"ordered_ids": ["0902", "0900", "0901"]}
      """
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"id": "0902", "position": 0},
        {"id": "0900", "position": 1},
        {"id": "0901", "position": 2}
      ]
      """
    And the labels table contains:
      | id   | name     | position | status |
      | 0900 | Set list | 1        | active |
      | 0901 | Practice | 2        | active |
      | 0902 | Ballad   | 0        | active |

  @error_case
  Scenario: Member (not manager) tries to reorder song labels — 403 error and positions stay unchanged
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
    And the labels table contains:
      | id   | project_id | name     | color   | position | status |
      | 0900 | 0020       | Set list | #22c55e | 0        | active |
      | 0901 | 0020       | Practice | #f97316 | 1        | active |
    When I PUT /api/features/tasks/guitar-songs/projects/0020/song-labels/reorder with body:
      """
      {"ordered_ids": ["0901", "0900"]}
      """
    Then the response status code is 403
    And the labels table contains:
      | id   | name     | position | status |
      | 0900 | Set list | 0        | active |
      | 0901 | Practice | 1        | active |

  @error_case
  Scenario: Member (not manager) tries to create a song label — 403 error and nothing is created
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
    And the labels table contains:
      | id | project_id | name | color | status |
    When I POST /api/features/tasks/guitar-songs/projects/0020/song-labels with body:
      """
      {"name": "Set list"}
      """
    Then the response status code is 403
    And the labels table contains:
      | id | project_id | name | color | status |
