@wip
Feature: Update notification status
  As an authenticated user
  I want to update the status of a notification
  So that I can mark it as read

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

  Scenario: PATCH /notifications/0010/status as admin — notification status is updated
    Given I am authenticated as an administrator: user.id 0001
    And the notifications table contains:
      | id   | target_user_id | message         | notification_status |
      | 0010 | 0001           | Test notification | planned           |
    When I PATCH /api/platform/tools/notifications/0010/status with body:
      """
      {"notification_status": "sent"}
      """
    Then the response status code is 200

  Scenario: PATCH /notifications/0010/status as a regular user — notification status is updated
    Given I am authenticated as a regular user: user.id 0002
    And the notifications table contains:
      | id   | target_user_id | message         | notification_status |
      | 0010 | 0002           | Test notification | planned           |
    When I PATCH /api/platform/tools/notifications/0010/status with body:
      """
      {"notification_status": "sent"}
      """
    Then the response status code is 200
