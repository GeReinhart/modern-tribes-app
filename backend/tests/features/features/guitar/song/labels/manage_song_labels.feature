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
