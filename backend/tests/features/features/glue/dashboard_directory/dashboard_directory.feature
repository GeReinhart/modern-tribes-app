Feature: Dashboard directory
  As a project member
  I want to see my accessible projects, task boards and event calendars with activity counts
  So that I can browse everything I have access to from the dashboard

  Background:
    Given the users table contains:
      | id   | email                 | status |
      | 0002 | user@test.com         | active |
      | 0003 | profile_user@test.com | active |
    And the roles table contains:
      | name          | status |
      | viewer        | active |
      | profile-owner | active |
    And the role_permissions table contains:
      | role          | permission                 |
      | viewer        | can_access_attached_tribes |
      | profile-owner | can_manage_own_profile     |
    And the user_roles table contains:
      | user                  | role          |
      | user@test.com         | viewer        |
      | profile_user@test.com | profile-owner |
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 0040 | Alice      | Member    | female | active |
    And the users table contains:
      | id   | email         | person_id | status |
      | 0002 | user@test.com | 0040      | active |
    And the tribes table contains:
      | id   | name    | status |
      | 0010 | DevTeam | active |
    And the projects table contains:
      | id   | name  | status |
      | 0020 | Alpha | active |
    And the tribes_projects table contains:
      | tribe_id | project_id |
      | 0010     | 0020       |
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0040      | member   | active |
    And the projects_features table contains:
      | id   | project_id | name     | feature_type | status |
      | 0030 | 0020       | Backlog  | kanban       | active |
      | 0031 | 0020       | Todo     | todo_list    | active |
      | 0032 | 0020       | Calendar | events       | active |
    And the kanban_columns table contains:
      | id   | feature_instance_id | name  | position | status |
      | 0050 | 0030                | To do | 0        | active |
      | 0051 | 0030                | Done  | 1        | active |

  Scenario: GET dashboard directory — projects, task boards and event calendars with activity counts
    Given I am authenticated as a regular user: user.id 0002
    And the kanban_cards table contains:
      | id   | feature_instance_id | column_id | title      | status |
      | 0100 | 0030                | 0050      | Open card  | active |
      | 0101 | 0030                | 0051      | Done card  | active |
    And the todo_items table contains:
      | id   | feature_instance_id | title       | todo_status | status |
      | 0200 | 0031                | Open item   | todo        | active |
      | 0201 | 0031                | Done item   | done        | active |
    And the events table contains:
      | id   | feature_instance_id | title         | start_at             | end_at               | status |
      | 0300 | 0032                | Future event  | 2099-01-01T10:00:00Z | 2099-01-01T11:00:00Z | active |
      | 0301 | 0032                | Past event    | 2000-01-01T10:00:00Z | 2000-01-01T11:00:00Z | active |
    When I GET /api/features/glue/dashboard-directory
    Then the response status code is 200
    And the response body includes:
      """
      {
        "projects": [
          {
            "project_id": "0020",
            "project_url_param_id": "000020",
            "project_name": "Alpha",
            "tribe_url_param_id": "000010",
            "tribe_name": "DevTeam",
            "open_task_count": 2,
            "upcoming_event_count": 1
          }
        ],
        "task_instances": [
          {
            "feature_instance_id": "0030",
            "feature_type": "kanban",
            "instance_name": "Backlog",
            "project_name": "Alpha",
            "tribe_name": "DevTeam",
            "open_count": 1
          },
          {
            "feature_instance_id": "0031",
            "feature_type": "todo_list",
            "instance_name": "Todo",
            "project_name": "Alpha",
            "tribe_name": "DevTeam",
            "open_count": 1
          }
        ],
        "event_instances": [
          {
            "feature_instance_id": "0032",
            "instance_name": "Calendar",
            "project_name": "Alpha",
            "tribe_name": "DevTeam",
            "upcoming_count": 1
          }
        ]
      }
      """

  Scenario: GET dashboard directory — no activity yet, counts are zero
    Given I am authenticated as a regular user: user.id 0002
    And the kanban_cards table contains:
      | id | feature_instance_id | column_id | title | status |
    And the todo_items table contains:
      | id | feature_instance_id | title | todo_status | status |
    And the events table contains:
      | id | feature_instance_id | title | start_at | end_at | status |
    When I GET /api/features/glue/dashboard-directory
    Then the response status code is 200
    And the response body includes:
      """
      {
        "projects": [
          {
            "project_id": "0020",
            "open_task_count": 0,
            "upcoming_event_count": 0
          }
        ],
        "task_instances": [
          { "feature_instance_id": "0030", "open_count": 0 },
          { "feature_instance_id": "0031", "open_count": 0 }
        ],
        "event_instances": [
          { "feature_instance_id": "0032", "upcoming_count": 0 }
        ]
      }
      """

  @error_case
  Scenario: GET dashboard directory as profile-only user — 403 error
    Given I am authenticated as the person's owner: user.id 0003
    When I GET /api/features/glue/dashboard-directory
    Then the response status code is 403
