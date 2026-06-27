Feature: Set reminders for a todo item
  As a project member
  I want to set reminders for a todo item
  So that I receive planned notifications before the task deadline

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
    And the tribes table contains:
      | id   | name    | status |
      | 0010 | DevTeam | active |
    And the projects table contains:
      | id   | name  | status |
      | 0020 | Alpha | active |
    And the tribes_projects table contains:
      | tribe_id | project_id |
      | 0010     | 0020       |
    And the persons table contains:
      | id   | first_name | last_name | status |
      | 0030 | Alice      | Smith     | active |
    And the represents table contains:
      | user_id | person_id |
      | 0002    | 0030      |
    And the positions table contains:
      | tribe_id | person_id | position |
      | 0010     | 0030      | member   |
    And the projects_features table contains:
      | id   | project_id | feature_type | name  | position | status |
      | 0040 | 0020       | todo         | Tasks | 0        | active |
    And the todo_items table contains:
      | id   | feature_instance_id | title   | created_by | status |
      | 0050 | 0040                | Fix bug | 0001       | active |

  Scenario: Setting a push reminder pre-creates a planned notification for the creator
    Given I am authenticated as an administrator: user.id 0001
    And the reminders table contains:
      | id | entity_type | entity_id | remind_at | reminder_type | sent |
    And the notifications table contains:
      | id | url_param_id | target_user_id | message | notification_status |
    When I POST /api/features/tasks/todo-items/0050/reminders with body:
      """
      [{"remind_at": "2099-01-01T08:00:00Z", "reminder_type": "notification"}]
      """
    Then the response status code is 200
    And the reminders table contains:
      | entity_type | entity_id | reminder_type | sent  |
      | todo_item   | 0050      | notification  | false |
    And the notifications table contains:
      | target_user_id | notification_status | scheduled_for             |
      | 0001           | planned             | 2099-01-01T08:00:00+00:00 |

  Scenario: Setting a push reminder with an assignee notifies creator and assignee
    Given I am authenticated as an administrator: user.id 0001
    And the todo_items table contains:
      | id   | feature_instance_id | title          | created_by | assigned_person_id | status |
      | 0051 | 0040                | Assign to Alice | 0001      | 0030               | active |
    And the reminders table contains:
      | id | entity_type | entity_id | remind_at | reminder_type | sent |
    And the notifications table contains:
      | id | url_param_id | target_user_id | message | notification_status |
    When I POST /api/features/tasks/todo-items/0051/reminders with body:
      """
      [{"remind_at": "2099-01-01T08:00:00Z", "reminder_type": "notification"}]
      """
    Then the response status code is 200
    And the reminders table contains:
      | entity_type | entity_id | reminder_type | sent  |
      | todo_item   | 0051      | notification  | false |
    And the notifications table contains:
      | target_user_id | notification_status | scheduled_for             |
      | 0001           | planned             | 2099-01-01T08:00:00+00:00 |
      | 0002           | planned             | 2099-01-01T08:00:00+00:00 |

  Scenario: Setting a mail reminder does not create notifications
    Given I am authenticated as an administrator: user.id 0001
    And the reminders table contains:
      | id | entity_type | entity_id | remind_at | reminder_type | sent |
    And the notifications table contains:
      | id | url_param_id | target_user_id | message | notification_status |
    When I POST /api/features/tasks/todo-items/0050/reminders with body:
      """
      [{"remind_at": "2099-01-01T08:00:00Z", "reminder_type": "mail"}]
      """
    Then the response status code is 200
    And the reminders table contains:
      | entity_type | entity_id | reminder_type | sent  |
      | todo_item   | 0050      | mail          | false |
    And the notifications table contains:
      | id | url_param_id | target_user_id | message | notification_status |

  Scenario: Re-setting reminders archives old notifications and creates new ones
    Given I am authenticated as an administrator: user.id 0001
    And the reminders table contains:
      | id   | entity_type | entity_id | remind_at            | reminder_type | sent  |
      | 0070 | todo_item   | 0050      | 2099-01-01T08:00:00Z | notification  | false |
    And the notifications table contains:
      | id   | target_user_id | message    | notification_status | scheduled_for             | reminder_id |
      | 0080 | 0001           | old remind | planned             | 2099-01-01T08:00:00+00:00 | 0070        |
    When I POST /api/features/tasks/todo-items/0050/reminders with body:
      """
      [{"remind_at": "2099-06-01T07:00:00Z", "reminder_type": "notification"}]
      """
    Then the response status code is 200
    And the reminders table contains:
      | entity_type | entity_id | reminder_type | sent  |
      | todo_item   | 0050      | notification  | false |
    And the notifications table contains:
      | target_user_id | status   | scheduled_for             |
      | 0001           | archived | 2099-01-01T08:00:00+00:00 |
      | 0001           | active   | 2099-06-01T07:00:00+00:00 |
