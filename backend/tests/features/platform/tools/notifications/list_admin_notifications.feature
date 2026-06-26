Feature: List all notifications for admin
  As an admin
  I want to retrieve all notifications sent to users
  So that I can monitor notification history

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

  Scenario: GET /notifications/admin as admin — all notifications returned with user email
    Given I am authenticated as an administrator: user.id 0001
    And the notifications table contains:
      | id   | target_user_id | message    | notification_status |
      | 0010 | 0002           | Hello user | planned             |
    When I GET /api/platform/tools/notifications/admin
    Then the response status code is 200
    And the response body includes:
      """
      [{"message": "Hello user", "target_user_email": "user@test.com", "notification_status": "planned"}]
      """
    And the notifications table contains:
      | id   | target_user_id | message    | notification_status |
      | 0010 | 0002           | Hello user | planned             |

  Scenario: GET /notifications/admin as regular user — access is denied
    Given I am authenticated as a regular user: user.id 0002
    And the notifications table contains:
      | id | target_user_id | message | notification_status |
    When I GET /api/platform/tools/notifications/admin
    Then the response status code is 403
    And the notifications table contains:
      | id | target_user_id | message | notification_status |
