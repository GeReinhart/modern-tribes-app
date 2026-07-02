Feature: List pinned bookmark tabs
  As a user with platform access
  I want to list my pinned bookmark tabs for the dashboard
  So that I can restore them when I open the dashboard

  Background:
    Given the users table contains:
      | id   | email                  | status |
      | 0001 | admin@test.com         | active |
      | 0002 | user@test.com          | active |
      | 0003 | profile_user@test.com  | active |
      | 0004 | other_user@test.com    | active |
    And the roles table contains:
      | name          | status |
      | administrator | active |
      | viewer        | active |
      | profile-owner | active |
    And the role_permissions table contains:
      | role          | permission                 |
      | administrator | admin                      |
      | viewer        | can_access_attached_tribes |
      | profile-owner | can_manage_own_profile     |
    And the user_roles table contains:
      | user                  | role          |
      | admin@test.com        | administrator |
      | user@test.com         | viewer        |
      | profile_user@test.com | profile-owner |
      | other_user@test.com   | viewer        |

  Scenario: GET /dashboard/pinned-tabs as viewer with two pinned tabs — returns only the user's tabs in order
    Given I am authenticated as a regular user: user.id 0002
    And the user_bookmarks table contains:
      | id   | user_id | page_path                              | page_title | display_order | status |
      | 0011 | 0002    | /app/tribes/t1/projects/p1/feat-uuid-1 | My Tasks   | 0             | active |
      | 0012 | 0002    | /app/tribes/t1/projects/p1/feat-uuid-2 | Journal    | 1             | active |
      | 0013 | 0004    | /app/tribes/t1/projects/p1/feat-uuid-3 | Other user | 0             | active |
    And the dashboard_pinned_tabs table contains:
      | id   | user_id | bookmark_id | display_order | status |
      | 0101 | 0002    | 0011        | 0             | active |
      | 0102 | 0002    | 0012        | 1             | active |
      | 0103 | 0004    | 0013        | 0             | active |
    When I GET /api/features/glue/dashboard/pinned-tabs
    Then the response status code is 200
    And the response body includes:
      """
      {
        "pinned_tabs": [
          {
            "id": "0101",
            "bookmark_id": "0011",
            "page_path": "/app/tribes/t1/projects/p1/feat-uuid-1",
            "page_title": "My Tasks",
            "display_order": 0
          },
          {
            "id": "0102",
            "bookmark_id": "0012",
            "page_path": "/app/tribes/t1/projects/p1/feat-uuid-2",
            "page_title": "Journal",
            "display_order": 1
          }
        ]
      }
      """

  Scenario: GET /dashboard/pinned-tabs as viewer with no pinned tabs — returns empty list
    Given I am authenticated as a regular user: user.id 0002
    And the user_bookmarks table contains:
      | id | user_id | page_path | page_title | display_order | status |
    And the dashboard_pinned_tabs table contains:
      | id | user_id | bookmark_id | display_order | status |
    When I GET /api/features/glue/dashboard/pinned-tabs
    Then the response status code is 200
    And the response body includes:
      """
      {"pinned_tabs": []}
      """

  @error_case
  Scenario: GET /dashboard/pinned-tabs as profile-only user — 403 error
    Given I am authenticated as the person's owner: user.id 0003
    And the user_bookmarks table contains:
      | id | user_id | page_path | page_title | display_order | status |
    And the dashboard_pinned_tabs table contains:
      | id | user_id | bookmark_id | display_order | status |
    When I GET /api/features/glue/dashboard/pinned-tabs
    Then the response status code is 403
