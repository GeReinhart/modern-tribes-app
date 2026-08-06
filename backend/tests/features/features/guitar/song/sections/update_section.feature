Feature: Rename a guitar song section
  As a project member
  I want to change a section's type or custom label
  So that I can correct or personalize how it's labelled

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
    And the guitar_songs table contains:
      | id   | project_id | title      | author | status |
      | 0200 | 0020       | Wonderwall | Oasis  | active |
    And the guitar_songs_sections table contains:
      | id   | song_id | position | type_label | custom_label | content_mode | status |
      | 0500 | 0200    | 1        | Couplet    |              | lyrics       | active |

  Scenario: PATCH a section's custom label — it overrides the auto-numbered display label
    Given I am authenticated as a regular user: user.id 0002
    When I PATCH /api/features/tasks/guitar-songs/sections/0500 with body:
      """
      {"custom_label": "Verse 1 (capo on)"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {"type_label": "Couplet", "custom_label": "Verse 1 (capo on)", "display_label": "Verse 1 (capo on)"}
      """
    And the guitar_songs_sections table contains:
      | song_id | position | type_label | custom_label      | content_mode | status |
      | 0200    | 1        | Couplet    | Verse 1 (capo on) | lyrics       | active |
