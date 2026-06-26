Feature: Register push subscription
  As an authenticated user
  I want to register my device for push notifications
  So that I receive notifications even when the app is not open

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

  Scenario: POST /push/subscribe with valid payload — subscription is saved
    Given I am authenticated as a regular user: user.id 0002
    And the push_subscriptions table contains:
      | id | user_id | endpoint | p256dh | auth | status |
    When I POST /api/platform/tools/notifications/push/subscribe with body:
      """
      {
        "endpoint": "https://fcm.googleapis.com/fcm/send/abc123",
        "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtZ",
        "auth": "tBHItJI5svbpez7KI4CCXg=="
      }
      """
    Then the response status code is 201
    And the push_subscriptions table contains:
      | endpoint                                   | status |
      | https://fcm.googleapis.com/fcm/send/abc123 | active |

  Scenario: DELETE /push/subscribe removes the subscription
    Given I am authenticated as a regular user: user.id 0002
    And the push_subscriptions table contains:
      | id   | user_id | endpoint                                   | p256dh                      | auth                     | status |
      | 0100 | 0002    | https://fcm.googleapis.com/fcm/send/abc123 | BNcRdreALRFXTkOOUHK1EtK2wtZ | tBHItJI5svbpez7KI4CCXg== | active |
    When I DELETE /api/platform/tools/notifications/push/subscribe with body:
      """
      {"endpoint": "https://fcm.googleapis.com/fcm/send/abc123"}
      """
    Then the response status code is 204
    And the push_subscriptions table contains:
      | id | user_id | endpoint | p256dh | auth | status |
