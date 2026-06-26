Feature: Get my tasks — force on dashboard
  As a project member
  I want to see tasks flagged as "force on dashboard" even if they are assigned to someone else
  So that important tasks are always visible to the whole team

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

  Scenario: GET /my-tasks — included: kanban card force_on_dashboard, assigned to someone else, user is project member
    Given I am authenticated as a regular user: user.id 0002
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 1001 | John       | Doe       | male   | active |
      | 1002 | Jane       | Smith     | female | active |
    And the represents table contains:
      | user_id | person_id | status |
      | 0002    | 1001      | active |
    And the tribes table contains:
      | id   | name        | status |
      | 3001 | Alpha Tribe | active |
    And the positions table contains:
      | id   | tribe_id | person_id | name   | status |
      | 8001 | 3001     | 1001      | member | active |
    And the projects table contains:
      | id   | name       | status |
      | 2001 | My Project | active |
    And the tribes_projects table contains:
      | tribe_id | project_id |
      | 3001     | 2001       |
    And the projects_features table contains:
      | id   | project_id | name      | feature_type | status |
      | 4001 | 2001       | My Kanban | kanban       | active |
    And the kanban_columns table contains:
      | id   | feature_instance_id | name        | position | status |
      | 5001 | 4001                | In Progress | 1        | active |
      | 5002 | 4001                | Done        | 2        | active |
    And the kanban_cards table contains:
      | id   | feature_instance_id | column_id | title          | assigned_person_id | force_on_dashboard | status |
      | 6001 | 4001                | 5001      | Team-wide card | 1002               | true               | active |
    When I GET /api/features/my-tasks
    Then the response status code is 200
    And the response body includes:
      """
      {
        "kanban": [
          { "id": "6001", "title": "Team-wide card", "force_on_dashboard": true }
        ],
        "todo": []
      }
      """
    And the kanban_cards table contains:
      | id   | feature_instance_id | column_id | title          | assigned_person_id | force_on_dashboard | status |
      | 6001 | 4001                | 5001      | Team-wide card | 1002               | true               | active |

  Scenario: GET /my-tasks — included: todo item force_on_dashboard, assigned to someone else, user is project member
    Given I am authenticated as a regular user: user.id 0002
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 1001 | John       | Doe       | male   | active |
      | 1002 | Jane       | Smith     | female | active |
    And the represents table contains:
      | user_id | person_id | status |
      | 0002    | 1001      | active |
    And the tribes table contains:
      | id   | name        | status |
      | 3001 | Alpha Tribe | active |
    And the positions table contains:
      | id   | tribe_id | person_id | name   | status |
      | 8001 | 3001     | 1001      | member | active |
    And the projects table contains:
      | id   | name       | status |
      | 2001 | My Project | active |
    And the tribes_projects table contains:
      | tribe_id | project_id |
      | 3001     | 2001       |
    And the projects_features table contains:
      | id   | project_id | name     | feature_type | status |
      | 4002 | 2001       | My Todos | todo         | active |
    And the todo_items table contains:
      | id   | feature_instance_id | title           | assigned_person_id | force_on_dashboard | todo_status | status |
      | 7001 | 4002                | Team-wide todo  | 1002               | true               | todo        | active |
    When I GET /api/features/my-tasks
    Then the response status code is 200
    And the response body includes:
      """
      {
        "kanban": [],
        "todo": [
          { "id": "7001", "title": "Team-wide todo", "force_on_dashboard": true }
        ]
      }
      """
    And the todo_items table contains:
      | id   | feature_instance_id | title          | assigned_person_id | force_on_dashboard | todo_status | status |
      | 7001 | 4002                | Team-wide todo | 1002               | true               | todo        | active |

  @error_case
  Scenario: GET /my-tasks — excluded: kanban card force_on_dashboard, but user is NOT a project member
    Given I am authenticated as a regular user: user.id 0002
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 1001 | John       | Doe       | male   | active |
      | 1002 | Jane       | Smith     | female | active |
    And the represents table contains:
      | user_id | person_id | status |
      | 0002    | 1001      | active |
    And the tribes table contains:
      | id   | name          | status |
      | 3001 | Another Tribe | active |
    And the projects table contains:
      | id   | name       | status |
      | 2001 | My Project | active |
    And the tribes_projects table contains:
      | tribe_id | project_id |
      | 3001     | 2001       |
    And the projects_features table contains:
      | id   | project_id | name      | feature_type | status |
      | 4001 | 2001       | My Kanban | kanban       | active |
    And the kanban_columns table contains:
      | id   | feature_instance_id | name        | position | status |
      | 5001 | 4001                | In Progress | 1        | active |
      | 5002 | 4001                | Done        | 2        | active |
    And the kanban_cards table contains:
      | id   | feature_instance_id | column_id | title          | assigned_person_id | force_on_dashboard | status |
      | 6001 | 4001                | 5001      | Team-wide card | 1002               | true               | active |
    When I GET /api/features/my-tasks
    Then the response status code is 200
    And the response body is:
      """
      { "kanban": [], "todo": [] }
      """
    And the kanban_cards table contains:
      | id   | feature_instance_id | column_id | title          | assigned_person_id | force_on_dashboard | status |
      | 6001 | 4001                | 5001      | Team-wide card | 1002               | true               | active |
