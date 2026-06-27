Feature: Get pending notifications
  As an authenticated user
  I want to retrieve my pending notifications
  So that I can stay informed about relevant activity

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

  Scenario: GET /notifications/pending as admin — pending notifications are returned
    Given I am authenticated as an administrator: user.id 0001
    When I GET /api/platform/tools/notifications/pending
    Then the response status code is 200

  Scenario: GET /notifications/pending as a regular user — pending notifications are returned
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/platform/tools/notifications/pending
    Then the response status code is 200

  Scenario: Future-scheduled notification is excluded from pending list
    Given I am authenticated as a regular user: user.id 0002
    And the notifications table contains:
      | id   | target_user_id | message      | notification_status | scheduled_for        |
      | 0010 | 0002           | Future notif | planned             | 2099-01-01T10:00:00Z |
    When I GET /api/platform/tools/notifications/pending
    Then the response status code is 200
    And the response body is:
      """
      []
      """
    And the notifications table contains:
      | id   | notification_status | scheduled_for        |
      | 0010 | planned             | 2099-01-01T10:00:00+00:00 |
