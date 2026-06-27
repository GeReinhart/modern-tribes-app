Feature: Push notification received acknowledgment
  As a service worker
  I want to confirm that a push notification was displayed on device
  So that its status is updated to sent in the database

  Background:
    Given the users table contains:
      | id   | email          | status |
      | 0001 | admin@test.com | active |
      | 0002 | user@test.com  | active |

  Scenario: POST /push/received with valid url_param_id — notification marked as sent
    And the notifications table contains:
      | id   | url_param_id | target_user_id | message           | notification_status |
      | 0010 | abc123xyz789 | 0002           | Test notification | planned             |
    When I POST /api/platform/tools/notifications/push/received with body:
      """
      {"url_param_id": "abc123xyz789"}
      """
    Then the response status code is 204
    And the notifications table contains:
      | id   | notification_status |
      | 0010 | sent                |

  Scenario: POST /push/received with unknown url_param_id — no error, no change
    When I POST /api/platform/tools/notifications/push/received with body:
      """
      {"url_param_id": "unknowntoken"}
      """
    Then the response status code is 204

  Scenario: POST /push/received on already-sent notification — idempotent, no change
    And the notifications table contains:
      | id   | url_param_id | target_user_id | message           | notification_status |
      | 0010 | abc123xyz789 | 0002           | Test notification | sent                |
    When I POST /api/platform/tools/notifications/push/received with body:
      """
      {"url_param_id": "abc123xyz789"}
      """
    Then the response status code is 204
    And the notifications table contains:
      | id   | notification_status |
      | 0010 | sent                |
