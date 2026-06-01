@wip
Feature: Create a mail
  As an administrator
  I want to create a mail
  So that it can be scheduled and sent to recipients

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

  Scenario: POST /mail/ with valid body as admin — the mail is created
    Given I am authenticated as an administrator: user.id 0001
    And the mails table contains:
      | id | subject | status |
    When I POST /api/platform/tools/mail/ with body:
      """
      {
        "subject": "Welcome",
        "content_html": "<p>Hello</p>",
        "planned_at": "2025-01-15T10:00:00"
      }
      """
    Then the response status code is 201
    And the mails table contains:
      | subject | mail_status | status  |
      | Welcome | not_sent    | pending |

  Scenario: POST /mail/ with missing subject — 422 error and the database is not modified
    Given I am authenticated as an administrator: user.id 0001
    And the mails table contains:
      | id | subject | status |
    When I POST /api/platform/tools/mail/ with body:
      """
      {"content_html": "<p>Hello</p>", "planned_at": "2025-01-15T10:00:00"}
      """
    Then the response status code is 422
    And the mails table contains:
      | id | subject | status |

  @error_case
  Scenario: POST /mail/ as a viewer — 403 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the mails table contains:
      | id | subject | status |
    When I POST /api/platform/tools/mail/ with body:
      """
      {
        "subject": "Welcome",
        "content_html": "<p>Hello</p>",
        "planned_at": "2025-01-15T10:00:00"
      }
      """
    Then the response status code is 403
    And the mails table contains:
      | id | subject | status |
