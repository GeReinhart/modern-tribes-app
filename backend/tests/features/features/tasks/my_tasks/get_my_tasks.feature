Feature: Get my tasks
  As a user with platform access
  I want to retrieve my tasks across all projects
  So that I can see tasks (assigned to me or unassigned) that have a due date or were created more than 100 days ago

  Background:
    Given the users table contains:
      | id   | email                 | status |
      | 0001 | admin@test.com        | active |
      | 0002 | user@test.com         | active |
      | 0003 | profile_user@test.com | active |
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

  Scenario: GET /my-tasks — included: task assigned to me with a due date
    Given I am authenticated as a regular user: user.id 0002
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 1001 | John       | Doe       | male   | active |
    And the represents table contains:
      | user_id | person_id | status |
      | 0002    | 1001      | active |
    And the projects table contains:
      | id   | name       | status |
      | 2001 | My Project | active |
    And the tribes table contains:
      | id   | name        | status |
      | 3001 | Alpha Tribe | active |
    And the tribes_projects table contains:
      | tribe_id | project_id |
      | 3001     | 2001       |
    And the projects_features table contains:
      | id   | project_id | name      | feature_type | status |
      | 4001 | 2001       | My Kanban | kanban       | active |
      | 4002 | 2001       | My Todos  | todo         | active |
    And the kanban_columns table contains:
      | id   | feature_instance_id | name        | position | status |
      | 5001 | 4001                | In Progress | 1        | active |
      | 5002 | 4001                | Done        | 2        | active |
    And the kanban_cards table contains:
      | id   | feature_instance_id | column_id | title       | assigned_person_id | due_date   | status |
      | 6001 | 4001                | 5001      | Fix the bug | 1001               | 2026-07-01 | active |
    And the todo_items table contains:
      | id   | feature_instance_id | title      | assigned_person_id | due_date   | todo_status | status |
      | 7001 | 4002                | Write docs | 1001               | 2026-07-01 | todo        | active |
    When I GET /api/features/my-tasks
    Then the response status code is 200
    And the response body includes:
      """
      {
        "kanban": [
          { "id": "6001", "title": "Fix the bug", "assigned_person_id": "1001", "due_date": "2026-07-01" }
        ],
        "todo": [
          { "id": "7001", "title": "Write docs", "assigned_person_id": "1001", "due_date": "2026-07-01" }
        ]
      }
      """
    And the kanban_cards table contains:
      | id   | feature_instance_id | column_id | title       | assigned_person_id | due_date   | status |
      | 6001 | 4001                | 5001      | Fix the bug | 1001               | 2026-07-01 | active |
    And the todo_items table contains:
      | id   | feature_instance_id | title      | assigned_person_id | due_date   | todo_status | status |
      | 7001 | 4002                | Write docs | 1001               | 2026-07-01 | todo        | active |

  Scenario: GET /my-tasks — included: unassigned task with a due date
    Given I am authenticated as a regular user: user.id 0002
    And the projects table contains:
      | id   | name       | status |
      | 2001 | My Project | active |
    And the tribes table contains:
      | id   | name        | status |
      | 3001 | Alpha Tribe | active |
    And the tribes_projects table contains:
      | tribe_id | project_id |
      | 3001     | 2001       |
    And the projects_features table contains:
      | id   | project_id | name      | feature_type | status |
      | 4001 | 2001       | My Kanban | kanban       | active |
      | 4002 | 2001       | My Todos  | todo         | active |
    And the kanban_columns table contains:
      | id   | feature_instance_id | name        | position | status |
      | 5001 | 4001                | In Progress | 1        | active |
      | 5002 | 4001                | Done        | 2        | active |
    And the kanban_cards table contains:
      | id   | feature_instance_id | column_id | title            | due_date   | status |
      | 6001 | 4001                | 5001      | Unassigned task  | 2026-07-01 | active |
    And the todo_items table contains:
      | id   | feature_instance_id | title            | due_date   | todo_status | status |
      | 7001 | 4002                | Unassigned todo  | 2026-07-01 | todo        | active |
    When I GET /api/features/my-tasks
    Then the response status code is 200
    And the response body includes:
      """
      {
        "kanban": [
          { "id": "6001", "title": "Unassigned task", "assigned_person_id": null, "due_date": "2026-07-01" }
        ],
        "todo": [
          { "id": "7001", "title": "Unassigned todo", "assigned_person_id": null, "due_date": "2026-07-01" }
        ]
      }
      """
    And the kanban_cards table contains:
      | id   | feature_instance_id | column_id | title           | due_date   | status |
      | 6001 | 4001                | 5001      | Unassigned task | 2026-07-01 | active |
    And the todo_items table contains:
      | id   | feature_instance_id | title           | due_date   | todo_status | status |
      | 7001 | 4002                | Unassigned todo | 2026-07-01 | todo        | active |

  Scenario: GET /my-tasks — included: task assigned to me, no due date, created more than 100 days ago
    Given I am authenticated as a regular user: user.id 0002
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 1001 | John       | Doe       | male   | active |
    And the represents table contains:
      | user_id | person_id | status |
      | 0002    | 1001      | active |
    And the projects table contains:
      | id   | name       | status |
      | 2001 | My Project | active |
    And the tribes table contains:
      | id   | name        | status |
      | 3001 | Alpha Tribe | active |
    And the tribes_projects table contains:
      | tribe_id | project_id |
      | 3001     | 2001       |
    And the projects_features table contains:
      | id   | project_id | name      | feature_type | status |
      | 4001 | 2001       | My Kanban | kanban       | active |
      | 4002 | 2001       | My Todos  | todo         | active |
    And the kanban_columns table contains:
      | id   | feature_instance_id | name        | position | status |
      | 5001 | 4001                | In Progress | 1        | active |
      | 5002 | 4001                | Done        | 2        | active |
    And the kanban_cards table contains:
      | id   | feature_instance_id | column_id | title      | assigned_person_id | created_at | status |
      | 6001 | 4001                | 5001      | Old task   | 1001               | 2026-01-01 | active |
    And the todo_items table contains:
      | id   | feature_instance_id | title    | assigned_person_id | created_at | todo_status | status |
      | 7001 | 4002                | Old todo | 1001               | 2026-01-01 | todo        | active |
    When I GET /api/features/my-tasks
    Then the response status code is 200
    And the response body includes:
      """
      {
        "kanban": [
          { "id": "6001", "title": "Old task", "assigned_person_id": "1001", "due_date": null }
        ],
        "todo": [
          { "id": "7001", "title": "Old todo", "assigned_person_id": "1001", "due_date": null }
        ]
      }
      """
    And the kanban_cards table contains:
      | id   | feature_instance_id | column_id | title    | assigned_person_id | status |
      | 6001 | 4001                | 5001      | Old task | 1001               | active |
    And the todo_items table contains:
      | id   | feature_instance_id | title    | assigned_person_id | todo_status | status |
      | 7001 | 4002                | Old todo | 1001               | todo        | active |

  Scenario: GET /my-tasks — included: unassigned task, no due date, created more than 100 days ago
    Given I am authenticated as a regular user: user.id 0002
    And the projects table contains:
      | id   | name       | status |
      | 2001 | My Project | active |
    And the tribes table contains:
      | id   | name        | status |
      | 3001 | Alpha Tribe | active |
    And the tribes_projects table contains:
      | tribe_id | project_id |
      | 3001     | 2001       |
    And the projects_features table contains:
      | id   | project_id | name      | feature_type | status |
      | 4001 | 2001       | My Kanban | kanban       | active |
      | 4002 | 2001       | My Todos  | todo         | active |
    And the kanban_columns table contains:
      | id   | feature_instance_id | name        | position | status |
      | 5001 | 4001                | In Progress | 1        | active |
      | 5002 | 4001                | Done        | 2        | active |
    And the kanban_cards table contains:
      | id   | feature_instance_id | column_id | title            | created_at | status |
      | 6001 | 4001                | 5001      | Old unassigned   | 2026-01-01 | active |
    And the todo_items table contains:
      | id   | feature_instance_id | title              | created_at | todo_status | status |
      | 7001 | 4002                | Old unassigned todo| 2026-01-01 | todo        | active |
    When I GET /api/features/my-tasks
    Then the response status code is 200
    And the response body includes:
      """
      {
        "kanban": [
          { "id": "6001", "title": "Old unassigned", "assigned_person_id": null, "due_date": null }
        ],
        "todo": [
          { "id": "7001", "title": "Old unassigned todo", "assigned_person_id": null, "due_date": null }
        ]
      }
      """
    And the kanban_cards table contains:
      | id   | feature_instance_id | column_id | title          | status |
      | 6001 | 4001                | 5001      | Old unassigned | active |
    And the todo_items table contains:
      | id   | feature_instance_id | title               | todo_status | status |
      | 7001 | 4002                | Old unassigned todo | todo        | active |

  @error_case
  Scenario: GET /my-tasks — excluded: task assigned to another person
    Given I am authenticated as a regular user: user.id 0002
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 1001 | John       | Doe       | male   | active |
      | 9001 | Other      | Person    | other  | active |
    And the represents table contains:
      | user_id | person_id | status |
      | 0002    | 1001      | active |
    And the projects table contains:
      | id   | name       | status |
      | 2001 | My Project | active |
    And the projects_features table contains:
      | id   | project_id | name      | feature_type | status |
      | 4001 | 2001       | My Kanban | kanban       | active |
      | 4002 | 2001       | My Todos  | todo         | active |
    And the kanban_columns table contains:
      | id   | feature_instance_id | name        | position | status |
      | 5001 | 4001                | In Progress | 1        | active |
      | 5002 | 4001                | Done        | 2        | active |
    And the kanban_cards table contains:
      | id   | feature_instance_id | column_id | title              | assigned_person_id | due_date   | status |
      | 6001 | 4001                | 5001      | Someone else task  | 9001               | 2026-07-01 | active |
    And the todo_items table contains:
      | id   | feature_instance_id | title              | assigned_person_id | due_date   | todo_status | status |
      | 7001 | 4002                | Someone else todo  | 9001               | 2026-07-01 | todo        | active |
    When I GET /api/features/my-tasks
    Then the response status code is 200
    And the response body is:
      """
      { "kanban": [], "todo": [] }
      """
    And the kanban_cards table contains:
      | id   | feature_instance_id | column_id | title             | assigned_person_id | due_date   | status |
      | 6001 | 4001                | 5001      | Someone else task | 9001               | 2026-07-01 | active |
    And the todo_items table contains:
      | id   | feature_instance_id | title             | assigned_person_id | due_date   | todo_status | status |
      | 7001 | 4002                | Someone else todo | 9001               | 2026-07-01 | todo        | active |

  @error_case
  Scenario: GET /my-tasks — excluded: task assigned to me, no due date, created less than 100 days ago
    Given I am authenticated as a regular user: user.id 0002
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 1001 | John       | Doe       | male   | active |
    And the represents table contains:
      | user_id | person_id | status |
      | 0002    | 1001      | active |
    And the projects table contains:
      | id   | name       | status |
      | 2001 | My Project | active |
    And the projects_features table contains:
      | id   | project_id | name      | feature_type | status |
      | 4001 | 2001       | My Kanban | kanban       | active |
      | 4002 | 2001       | My Todos  | todo         | active |
    And the kanban_columns table contains:
      | id   | feature_instance_id | name        | position | status |
      | 5001 | 4001                | In Progress | 1        | active |
      | 5002 | 4001                | Done        | 2        | active |
    And the kanban_cards table contains:
      | id   | feature_instance_id | column_id | title        | assigned_person_id | created_at | status |
      | 6001 | 4001                | 5001      | Recent task  | 1001               | 2026-05-01 | active |
    And the todo_items table contains:
      | id   | feature_instance_id | title       | assigned_person_id | created_at | todo_status | status |
      | 7001 | 4002                | Recent todo | 1001               | 2026-05-01 | todo        | active |
    When I GET /api/features/my-tasks
    Then the response status code is 200
    And the response body is:
      """
      { "kanban": [], "todo": [] }
      """
    And the kanban_cards table contains:
      | id   | feature_instance_id | column_id | title       | assigned_person_id | status |
      | 6001 | 4001                | 5001      | Recent task | 1001               | active |
    And the todo_items table contains:
      | id   | feature_instance_id | title       | assigned_person_id | todo_status | status |
      | 7001 | 4002                | Recent todo | 1001               | todo        | active |

  @error_case
  Scenario: GET /my-tasks as a user with no app access — 403 error
    Given I am authenticated as the person's owner: user.id 0003
    When I GET /api/features/my-tasks
    Then the response status code is 403
