Feature: Update a guitar song's print page margins
  As a project member
  I want to adjust a song's print page margins
  So that the PDF fits nicely once printed

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
    And the guitar_songs table contains:
      | id   | project_id | title      | author | status |
      | 0200 | 0020       | Wonderwall | Oasis  | active |
    And the guitar_songs_layout_settings table contains:
      | id   | song_id | margin_top_mm | margin_right_mm | margin_bottom_mm | margin_left_mm | footer_spacing_mm | status |
      | 0900 | 0200    | 15.0          | 15.0             | 15.0              | 15.0            | 5.0                | active |

  Scenario: PATCH the page margins — they are updated
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I PATCH /api/features/tasks/guitar-songs/songs/0200/layout/settings with body:
      """
      {"margin_top_mm": 20.0, "margin_left_mm": 25.5}
      """
    Then the response status code is 200
    And the guitar_songs_layout_settings table contains:
      | song_id | margin_top_mm | margin_right_mm | margin_bottom_mm | margin_left_mm | footer_spacing_mm | status |
      | 0200    | 20.0           | 15.0             | 15.0              | 25.5            | 5.0                | active |

  Scenario: PATCH the footer spacing — it is updated, margins stay the same
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I PATCH /api/features/tasks/guitar-songs/songs/0200/layout/settings with body:
      """
      {"footer_spacing_mm": 8.0}
      """
    Then the response status code is 200
    And the guitar_songs_layout_settings table contains:
      | song_id | margin_top_mm | margin_right_mm | margin_bottom_mm | margin_left_mm | footer_spacing_mm | status |
      | 0200    | 15.0           | 15.0             | 15.0              | 15.0            | 8.0                | active |

  @error_case
  Scenario: PATCH the page margins as a project guest — 403 and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1002 | 0010     | 0030      | guest    | active |
    When I PATCH /api/features/tasks/guitar-songs/songs/0200/layout/settings with body:
      """
      {"margin_top_mm": 20.0}
      """
    Then the response status code is 403
    And the guitar_songs_layout_settings table contains:
      | song_id | margin_top_mm | margin_right_mm | margin_bottom_mm | margin_left_mm | footer_spacing_mm | status |
      | 0200    | 15.0           | 15.0             | 15.0              | 15.0            | 5.0                | active |

  @error_case
  Scenario: PATCH a margin out of range — 422 and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I PATCH /api/features/tasks/guitar-songs/songs/0200/layout/settings with body:
      """
      {"margin_top_mm": 500}
      """
    Then the response status code is 422
    And the guitar_songs_layout_settings table contains:
      | song_id | margin_top_mm | margin_right_mm | margin_bottom_mm | margin_left_mm | footer_spacing_mm | status |
      | 0200    | 15.0           | 15.0             | 15.0              | 15.0            | 5.0                | active |

  @error_case
  Scenario: PATCH a footer spacing greater than or equal to the bottom margin — 422 and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I PATCH /api/features/tasks/guitar-songs/songs/0200/layout/settings with body:
      """
      {"footer_spacing_mm": 15.0}
      """
    Then the response status code is 422
    And the guitar_songs_layout_settings table contains:
      | song_id | margin_top_mm | margin_right_mm | margin_bottom_mm | margin_left_mm | footer_spacing_mm | status |
      | 0200    | 15.0           | 15.0             | 15.0              | 15.0            | 5.0                | active |

  @error_case
  Scenario: PATCH both the bottom margin and the footer spacing in the same request, spacing left too large for the new margin — 422 and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I PATCH /api/features/tasks/guitar-songs/songs/0200/layout/settings with body:
      """
      {"margin_bottom_mm": 10.0, "footer_spacing_mm": 12.0}
      """
    Then the response status code is 422
    And the guitar_songs_layout_settings table contains:
      | song_id | margin_top_mm | margin_right_mm | margin_bottom_mm | margin_left_mm | footer_spacing_mm | status |
      | 0200    | 15.0           | 15.0             | 15.0              | 15.0            | 5.0                | active |
