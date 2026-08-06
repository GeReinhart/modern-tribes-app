Feature: List a project's guitar song authors
  As a project member
  I want to see the authors already used in the project's songbook
  So that I can pick one instead of retyping a name that already exists

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
      | 1001 | 0010     | 0030      | guest    | active |
    And the guitar_song_author table contains:
      | id   | project_id | name            | status |
      | 0900 | 0020       | Oasis           | active |
      | 0901 | 0020       | The Lumineers   | active |
      | 0902 | 0020       | Retired Author  | archived |

  Scenario: GET the authors of a project — only active authors are listed, alphabetically
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tasks/guitar-song-authors/projects/0020
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"id": "0900", "name": "Oasis"},
        {"id": "0901", "name": "The Lumineers"}
      ]
      """
