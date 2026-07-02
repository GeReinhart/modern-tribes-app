Feature: Pin a bookmark as a dashboard tab
  As a user with platform access
  I want to pin a bookmark as a tab on my dashboard
  So that I can access its content directly from the dashboard

  Background:
    Given the users table contains:
      | id   | email                 | status |
      | 0001 | admin@test.com        | active |
      | 0002 | user@test.com         | active |
      | 0003 | profile_user@test.com | active |
      | 0004 | other_user@test.com   | active |
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

  Scenario: POST /dashboard/pinned-tabs as viewer with a valid bookmark — the tab is pinned
    Given I am authenticated as a regular user: user.id 0002
    And the user_bookmarks table contains:
      | id   | user_id | page_path                              | page_title | display_order | status |
      | 0011 | 0002    | /app/tribes/t1/projects/p1/feat-uuid-1 | My Tasks   | 0             | active |
    And the dashboard_pinned_tabs table contains:
      | id | user_id | bookmark_id | display_order | status |
    When I POST /api/features/glue/dashboard/pinned-tabs with body:
      """
      {"bookmark_id": "0011"}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "bookmark_id": "0011",
        "page_path": "/app/tribes/t1/projects/p1/feat-uuid-1",
        "page_title": "My Tasks",
        "display_order": 0
      }
      """
    And the dashboard_pinned_tabs table contains:
      | user_id | bookmark_id | display_order | status |
      | 0002    | 0011        | 0             | active |

  Scenario: POST /dashboard/pinned-tabs with a second bookmark — display_order is incremented
    Given I am authenticated as a regular user: user.id 0002
    And the user_bookmarks table contains:
      | id   | user_id | page_path                              | page_title | display_order | status |
      | 0011 | 0002    | /app/tribes/t1/projects/p1/feat-uuid-1 | My Tasks   | 0             | active |
      | 0012 | 0002    | /app/tribes/t1/projects/p1/feat-uuid-2 | Journal    | 1             | active |
    And the dashboard_pinned_tabs table contains:
      | id   | user_id | bookmark_id | display_order | status |
      | 0101 | 0002    | 0011        | 0             | active |
    When I POST /api/features/glue/dashboard/pinned-tabs with body:
      """
      {"bookmark_id": "0012"}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "bookmark_id": "0012",
        "display_order": 1
      }
      """
    And the dashboard_pinned_tabs table contains:
      | user_id | bookmark_id | display_order | status |
      | 0002    | 0011        | 0             | active |
      | 0002    | 0012        | 1             | active |

  @error_case
  Scenario: POST /dashboard/pinned-tabs with a bookmark that belongs to another user — 403 error
    Given I am authenticated as a regular user: user.id 0002
    And the user_bookmarks table contains:
      | id   | user_id | page_path    | page_title     | display_order | status |
      | 0013 | 0004    | /app/tribes  | Other bookmark | 0             | active |
    And the dashboard_pinned_tabs table contains:
      | id | user_id | bookmark_id | display_order | status |
    When I POST /api/features/glue/dashboard/pinned-tabs with body:
      """
      {"bookmark_id": "0013"}
      """
    Then the response status code is 403
    And the dashboard_pinned_tabs table contains:
      | id | user_id | bookmark_id | display_order | status |

  @error_case
  Scenario: POST /dashboard/pinned-tabs with a bookmark already pinned — 409 conflict
    Given I am authenticated as a regular user: user.id 0002
    And the user_bookmarks table contains:
      | id   | user_id | page_path                              | page_title | display_order | status |
      | 0011 | 0002    | /app/tribes/t1/projects/p1/feat-uuid-1 | My Tasks   | 0             | active |
    And the dashboard_pinned_tabs table contains:
      | id   | user_id | bookmark_id | display_order | status |
      | 0101 | 0002    | 0011        | 0             | active |
    When I POST /api/features/glue/dashboard/pinned-tabs with body:
      """
      {"bookmark_id": "0011"}
      """
    Then the response status code is 409
    And the dashboard_pinned_tabs table contains:
      | id   | user_id | bookmark_id | display_order | status |
      | 0101 | 0002    | 0011        | 0             | active |

  @error_case
  Scenario: POST /dashboard/pinned-tabs as profile-only user — 403 error
    Given I am authenticated as the person's owner: user.id 0003
    And the user_bookmarks table contains:
      | id | user_id | page_path | page_title | display_order | status |
    And the dashboard_pinned_tabs table contains:
      | id | user_id | bookmark_id | display_order | status |
    When I POST /api/features/glue/dashboard/pinned-tabs with body:
      """
      {"bookmark_id": "0011"}
      """
    Then the response status code is 403
    And the dashboard_pinned_tabs table contains:
      | id | user_id | bookmark_id | display_order | status |
