Feature: Unpin a bookmark tab from the dashboard
  As a user with platform access
  I want to unpin a bookmark tab from my dashboard
  So that the tab no longer appears in my dashboard

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

  Scenario: DELETE /dashboard/pinned-tabs/{id} as the owner — the tab is removed
    Given I am authenticated as a regular user: user.id 0002
    And the user_bookmarks table contains:
      | id   | user_id | page_path                              | page_title | display_order | status |
      | 0011 | 0002    | /app/tribes/t1/projects/p1/feat-uuid-1 | My Tasks   | 0             | active |
      | 0012 | 0002    | /app/tribes/t1/projects/p1/feat-uuid-2 | Journal    | 1             | active |
    And the dashboard_pinned_tabs table contains:
      | id   | user_id | bookmark_id | display_order | status |
      | 0101 | 0002    | 0011        | 0             | active |
      | 0102 | 0002    | 0012        | 1             | active |
    When I DELETE /api/features/glue/dashboard/pinned-tabs/0101
    Then the response status code is 204
    And the dashboard_pinned_tabs table contains:
      | id   | user_id | bookmark_id | display_order | status   |
      | 0101 | 0002    | 0011        | 0             | archived |
      | 0102 | 0002    | 0012        | 1             | active   |

  @error_case
  Scenario: DELETE /dashboard/pinned-tabs/{id} on a tab belonging to another user — 403 error
    Given I am authenticated as a regular user: user.id 0002
    And the user_bookmarks table contains:
      | id   | user_id | page_path    | page_title     | display_order | status |
      | 0013 | 0004    | /app/tribes  | Other bookmark | 0             | active |
    And the dashboard_pinned_tabs table contains:
      | id   | user_id | bookmark_id | display_order | status |
      | 0103 | 0004    | 0013        | 0             | active |
    When I DELETE /api/features/glue/dashboard/pinned-tabs/0103
    Then the response status code is 403
    And the dashboard_pinned_tabs table contains:
      | id   | user_id | bookmark_id | display_order | status |
      | 0103 | 0004    | 0013        | 0             | active |

  @error_case
  Scenario: DELETE /dashboard/pinned-tabs/{id} with a non-existent id — 404 error
    Given I am authenticated as a regular user: user.id 0002
    And the user_bookmarks table contains:
      | id | user_id | page_path | page_title | display_order | status |
    And the dashboard_pinned_tabs table contains:
      | id | user_id | bookmark_id | display_order | status |
    When I DELETE /api/features/glue/dashboard/pinned-tabs/0199
    Then the response status code is 404
