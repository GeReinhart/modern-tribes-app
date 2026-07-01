Feature: Search indexing for journal blocks
  As a project member
  I want journal blocks to appear in global search results
  So that I can find past notes by their content

  Background:
    Given the users table contains:
      | id   | email          | status |
      | 0001 | admin@test.com | active |
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
      | id   | name    | url_param_id | status |
      | 0010 | DevTeam | tribe1       | active |
    And the projects table contains:
      | id   | name  | url_param_id | status |
      | 0020 | Alpha | proj1        | active |
    And the tribes_projects table contains:
      | tribe_id | project_id |
      | 0010     | 0020       |
    And the projects_features table contains:
      | id   | project_id | feature_type  | name    | position | status |
      | 0040 | 0020       | daily_journal | Journal | 0        | active |

  Scenario: POST /journal-blocks as admin — block is indexed in search
    Given I am authenticated as an administrator: user.id 0001
    And the journal_blocks table contains:
      | id | feature_instance_id | date | document_id | position | status |
    And the search_index table contains:
      | entity_type | entity_id | content_text | status |
    When I POST /api/features/daily-journal/blocks with body:
      """
      {
        "feature_instance_id": "0040",
        "date": "2026-07-01",
        "position": 0,
        "content_html": "<p>Stand-up: all green</p>"
      }
      """
    Then the response status code is 201
    And the search_index table contains:
      | entity_type   | status |
      | journal_block | active |

  Scenario: PATCH /journal-blocks/{id} — search index is refreshed on content update
    Given I am authenticated as an administrator: user.id 0001
    And the documents table contains:
      | id   | content_html    | content_text |
      | 0101 | <p>Old note</p> | Old note     |
    And the journal_blocks table contains:
      | id   | feature_instance_id | date       | document_id | position | status |
      | 0011 | 0040                | 2026-07-01 | 0101        | 0        | active |
    And the search_index table contains:
      | entity_type   | entity_id | content_text | status |
      | journal_block | 0011      | Old note     | active |
    When I PATCH /api/features/daily-journal/blocks/0011 with body:
      """
      {"content_html": "<p>Updated note</p>"}
      """
    Then the response status code is 200
    And the search_index table contains:
      | entity_type   | entity_id | status |
      | journal_block | 0011      | active |

  Scenario: DELETE /journal-blocks/{id} — search index entry is archived
    Given I am authenticated as an administrator: user.id 0001
    And the documents table contains:
      | id   | content_html  | content_text |
      | 0101 | <p>A note</p> | A note       |
    And the journal_blocks table contains:
      | id   | feature_instance_id | date       | document_id | position | status |
      | 0011 | 0040                | 2026-07-01 | 0101        | 0        | active |
    And the search_index table contains:
      | entity_type   | entity_id | content_text | status |
      | journal_block | 0011      | A note       | active |
    When I DELETE /api/features/daily-journal/blocks/0011
    Then the response status code is 200
    And the search_index table contains:
      | entity_type   | entity_id | status   |
      | journal_block | 0011      | archived |
