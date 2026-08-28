@wip
Feature: Reorder recipe labels
  As a project member
  I want to choose the display order of a recipe book's labels
  So that the ones I use most show up first

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
    And the persons table contains:
      | id   | first_name | last_name | status |
      | 0030 | Mia        | Member    | active |
    And the users table contains:
      | id   | email         | person_id | status |
      | 0002 | user@test.com | 0030      | active |
    And the tribes table contains:
      | id   | name | status |
      | 0010 | Home | active |
    And the projects table contains:
      | id   | name    | status |
      | 0100 | Project | active |
    And the tribes_projects table contains:
      | tribe_id | project_id | relation |
      | 0010     | 0100       | manager  |
    And the projects_features table contains:
      | id   | project_id | name    | feature_type | status |
      | 0040 | 0100       | Recipes | recipes      | active |
    And the labels table contains:
      | id   | name    | color   | position | feature_instance_id | status |
      | 2001 | Quick   | #ef4444 | 0        | 0040                 | active |
      | 2002 | Family  | #22c55e | 1        | 0040                 | active |
      | 2003 | Holiday | #3b82f6 | 2        | 0040                 | active |

  Scenario: PUT /recipe-labels/reorder as a manager — the labels are returned and stored in the new order
    Given I am authenticated as an administrator: user.id 0001
    When I PUT /api/features/tasks/recipe-labels/reorder with body:
      """
      {"feature_instance_id": "0040", "ordered_ids": ["2003", "2001", "2002"]}
      """
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"id": "2003", "name": "Holiday"},
        {"id": "2001", "name": "Quick"},
        {"id": "2002", "name": "Family"}
      ]
      """
    And the labels table contains:
      | id   | name    | position |
      | 2001 | Quick   | 1        |
      | 2002 | Family  | 2        |
      | 2003 | Holiday | 0        |

  @error_case
  Scenario: PUT /recipe-labels/reorder as a member (not a manager) — 403 error and the order is not changed
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I PUT /api/features/tasks/recipe-labels/reorder with body:
      """
      {"feature_instance_id": "0040", "ordered_ids": ["2003", "2001", "2002"]}
      """
    Then the response status code is 403
    And the labels table contains:
      | id   | name    | position |
      | 2001 | Quick   | 0        |
      | 2002 | Family  | 1        |
      | 2003 | Holiday | 2        |

  Scenario: PATCH /recipe-labels/2001 with status archived — the label is archived and no longer listed
    Given I am authenticated as an administrator: user.id 0001
    When I PATCH /api/features/tasks/recipe-labels/2001 with body:
      """
      {"status": "archived"}
      """
    Then the response status code is 200
    And the labels table contains:
      | id   | name    | status   |
      | 2001 | Quick   | archived |
      | 2002 | Family  | active   |
      | 2003 | Holiday | active   |
    When I GET /api/features/tasks/recipe-labels/by-instance/0040
    Then the response status code is 200
    And the response body is:
      """
      [
        {"id": "2002", "name": "Family", "color": "#22c55e", "position": 1},
        {"id": "2003", "name": "Holiday", "color": "#3b82f6", "position": 2}
      ]
      """

  @error_case
  Scenario: PUT /recipe-labels/reorder with an incomplete list — 400 error and the order is not changed
    Given I am authenticated as an administrator: user.id 0001
    When I PUT /api/features/tasks/recipe-labels/reorder with body:
      """
      {"feature_instance_id": "0040", "ordered_ids": ["2003", "2001"]}
      """
    Then the response status code is 400
    And the labels table contains:
      | id   | name    | position |
      | 2001 | Quick   | 0        |
      | 2002 | Family  | 1        |
      | 2003 | Holiday | 2        |

  @error_case
  Scenario: PUT /recipe-labels/reorder with a label from another feature instance — 400 error and neither instance's order changes
    Given the projects_features table contains:
      | id   | project_id | name       | feature_type | status |
      | 0041 | 0100       | Other Book | recipes      | active |
    And the labels table contains:
      | id   | name   | color   | position | feature_instance_id | status |
      | 3001 | Snacks | #6b7280 | 0        | 0041                 | active |
    And I am authenticated as an administrator: user.id 0001
    When I PUT /api/features/tasks/recipe-labels/reorder with body:
      """
      {"feature_instance_id": "0040", "ordered_ids": ["2003", "2001", "3001"]}
      """
    Then the response status code is 400
    And the labels table contains:
      | id   | name    | position | feature_instance_id |
      | 2001 | Quick   | 0        | 0040                 |
      | 2002 | Family  | 1        | 0040                 |
      | 2003 | Holiday | 2        | 0040                 |
      | 3001 | Snacks  | 0        | 0041                 |
