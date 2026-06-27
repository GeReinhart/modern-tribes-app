Feature: Archive old notifications
  As the system
  I want to archive notifications older than the retention period
  So that the active notifications table stays manageable

  Background:
    Given the users table contains:
      | id   | email          | status |
      | 0001 | admin@test.com | active |
      | 0002 | user@test.com  | active |

  Scenario: Sent notifications older than retention days are archived
    Given the notifications table contains:
      | id   | target_user_id | message | notification_status | created_at              |
      | 0010 | 0002           | Old msg | sent                | 2020-01-01 00:00:00+00  |
    When the system archives notifications older than 30 days
    Then the notifications table contains:
      | id   | status   |
      | 0010 | archived |

  Scenario: Failed notifications older than retention days are archived
    Given the notifications table contains:
      | id   | target_user_id | message | notification_status | created_at              |
      | 0010 | 0002           | Old msg | failed              | 2020-01-01 00:00:00+00  |
    When the system archives notifications older than 30 days
    Then the notifications table contains:
      | id   | status   |
      | 0010 | archived |

  Scenario: Planned notifications are never archived even if old
    Given the notifications table contains:
      | id   | target_user_id | message       | notification_status | created_at              |
      | 0010 | 0002           | Pending msg   | planned             | 2020-01-01 00:00:00+00  |
    When the system archives notifications older than 30 days
    Then the notifications table contains:
      | id   | status |
      | 0010 | active |

  Scenario: Recent sent notifications are not archived
    Given the notifications table contains:
      | id   | target_user_id | message     | notification_status |
      | 0010 | 0002           | Recent msg  | sent                |
    When the system archives notifications older than 30 days
    Then the notifications table contains:
      | id   | status |
      | 0010 | active |
