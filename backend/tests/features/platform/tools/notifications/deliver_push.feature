Feature: Deliver push notifications
  As an administrator
  I want the notifications I create to be pushed to the user's devices
  So that they are received even when the app is closed

  Background:
    Given the users table contains:
      | id   | email          | status |
      | 0001 | admin@test.com | active |
      | 0002 | user@test.com  | active |
    And the roles table contains:
      | name          | status |
      | administrator | active |
    And the role_permissions table contains:
      | role          | permission |
      | administrator | admin      |
    And the user_roles table contains:
      | user           | role          |
      | admin@test.com | administrator |
    And VAPID keys are configured

  Scenario: POST /notifications/admin with a bare-email VAPID subject — push is signed with a mailto: subject
    Given I am authenticated as an administrator: user.id 0001
    And the VAPID subject setting is "no-reply@test.com"
    And the push_subscriptions table contains:
      | id   | user_id | endpoint                | p256dh | auth | status |
      | 0100 | 0002    | https://push.test/aaa   | key1   | sec1 | active |
    When I POST /api/platform/tools/notifications/admin with body:
      """
      {"target_user_id": "0002", "message": "Hello"}
      """
    Then the response status code is 201
    And the push service was called with subject "mailto:no-reply@test.com"
    And the push_subscriptions table contains:
      | id   | user_id | endpoint                | status |
      | 0100 | 0002    | https://push.test/aaa   | active |

  Scenario: POST /notifications/admin with a blank VAPID subject — push is signed with the default subject
    Given I am authenticated as an administrator: user.id 0001
    And the VAPID subject setting is ""
    And the push_subscriptions table contains:
      | id   | user_id | endpoint                | p256dh | auth | status |
      | 0100 | 0002    | https://push.test/aaa   | key1   | sec1 | active |
    When I POST /api/platform/tools/notifications/admin with body:
      """
      {"target_user_id": "0002", "message": "Hello"}
      """
    Then the response status code is 201
    And the push service was called with subject "mailto:admin@modern-tribes.com"

  Scenario: POST /notifications/admin with an expired subscription — it is removed and the other one still receives the push
    Given I am authenticated as an administrator: user.id 0001
    And the push_subscriptions table contains:
      | id   | user_id | endpoint                | p256dh | auth | status |
      | 0100 | 0002    | https://push.test/gone  | key1   | sec1 | active |
      | 0101 | 0002    | https://push.test/ok    | key2   | sec2 | active |
    And the push service answers "410" for endpoint "https://push.test/gone"
    When I POST /api/platform/tools/notifications/admin with body:
      """
      {"target_user_id": "0002", "message": "Hello"}
      """
    Then the response status code is 201
    And the push service received a push for endpoint "https://push.test/ok"
    And the push_subscriptions table contains:
      | id   | user_id | endpoint                | status |
      | 0101 | 0002    | https://push.test/ok    | active |

  Scenario: POST /notifications/admin when signing fails on one subscription — the other one still receives the push
    Given I am authenticated as an administrator: user.id 0001
    And the push_subscriptions table contains:
      | id   | user_id | endpoint                | p256dh | auth | status |
      | 0100 | 0002    | https://push.test/bad   | key1   | sec1 | active |
      | 0101 | 0002    | https://push.test/ok    | key2   | sec2 | active |
    And the push service fails to sign for endpoint "https://push.test/bad"
    When I POST /api/platform/tools/notifications/admin with body:
      """
      {"target_user_id": "0002", "message": "Hello"}
      """
    Then the response status code is 201
    And the push service received a push for endpoint "https://push.test/ok"
    And the push_subscriptions table contains:
      | id   | user_id | endpoint                | status |
      | 0100 | 0002    | https://push.test/bad   | active |
      | 0101 | 0002    | https://push.test/ok    | active |
