Feature: List accessible journal dates for a month

  Background:
    Given the following users exist:
      | id                                   | email            | name    |
      | aaaaaaaa-0000-0000-0000-000000000001 | alice@example.com | Alice  |
      | aaaaaaaa-0000-0000-0000-000000000002 | bob@example.com   | Bob    |
    And the following projects exist:
      | id                                   | name          |
      | bbbbbbbb-0000-0000-0000-000000000001 | Project Alpha |
    And the following journal feature instances exist:
      | id                                   | project_id                           | name    |
      | cccccccc-0000-0000-0000-000000000001 | bbbbbbbb-0000-0000-0000-000000000001 | Journal |
    And Alice is a member of the tribe that has access to Project Alpha
    And the following journal blocks exist:
      | id                                   | feature_instance_id                  | date       | status   |
      | dddddddd-0000-0000-0000-000000000001 | cccccccc-0000-0000-0000-000000000001 | 2026-07-05 | active   |
      | dddddddd-0000-0000-0000-000000000002 | cccccccc-0000-0000-0000-000000000001 | 2026-07-05 | active   |
      | dddddddd-0000-0000-0000-000000000003 | cccccccc-0000-0000-0000-000000000001 | 2026-07-12 | active   |
      | dddddddd-0000-0000-0000-000000000004 | cccccccc-0000-0000-0000-000000000001 | 2026-07-12 | archived |
      | dddddddd-0000-0000-0000-000000000005 | cccccccc-0000-0000-0000-000000000001 | 2026-08-01 | active   |

  Scenario: Returns dates with active blocks in the requested month for an accessible journal
    Given I am authenticated as Alice
    When I request accessible journal dates for year 2026 month 7
    Then I receive dates: "2026-07-05", "2026-07-12"
    And the date "2026-08-01" is not included

  Scenario: Archived blocks are not counted as active dates
    Given I am authenticated as Alice
    When I request accessible journal dates for year 2026 month 7
    Then I receive dates: "2026-07-05", "2026-07-12"

  Scenario: No active blocks in month returns empty list
    Given I am authenticated as Alice
    When I request accessible journal dates for year 2026 month 6
    Then I receive an empty date list

  Scenario: Unauthenticated user gets a 403
    Given I am not authenticated
    When I request accessible journal dates for year 2026 month 7
    Then I receive a 403 error
