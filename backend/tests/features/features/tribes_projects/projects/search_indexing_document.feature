Feature: Search indexing for project documents
  As a project member
  I want project documents to be searchable by title and labels
  So that users can find documents through global search

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
      | id   | name  | url_param_id | status |
      | 0050 | Tribe | tribe1       | active |
    And the projects table contains:
      | id   | name    | url_param_id | status |
      | 0100 | Project | proj1        | active |
    And the tribes_projects table contains:
      | tribe_id | project_id |
      | 0050     | 0100       |

  Scenario: POST /projects/{id}/documents with labels — label names appear in search index content
    Given I am authenticated as an administrator: user.id 0001
    And the labels table contains:
      | id | name | color | status |
    And the label_entities table contains:
      | label_id | entity_type | entity_id |
    And the search_index table contains:
      | entity_type | entity_id | content_text | status |
    When I POST /api/project-documents/projects/0100/documents with body:
      """
      {"title": "Example de mauvais code", "content_html": "<p>vraie histoire</p>", "label_names": ["Papier", "SnowCamp"]}
      """
    Then the response status code is 201
    And the labels table contains:
      | name    |
      | Papier  |
      | SnowCamp |
    And the label_entities table contains:
      | entity_type |
      | document    |
      | document    |
    And the search_index table contains:
      | entity_type | content_text                                              | status |
      | document    | Example de mauvais code Papier SnowCamp vraie histoire    | active |

  Scenario: PUT /projects/{id}/documents/{id} label update — label name appears in search index content
    Given I am authenticated as an administrator: user.id 0001
    And the documents table contains:
      | id   | content_html          | content_text   | status |
      | 0200 | <p>vraie histoire</p> | vraie histoire | active |
    And the projects_documents table contains:
      | id   | project_id | document_id | title                   | url_param_id | status |
      | 0300 | 0100       | 0200        | Example de mauvais code | doc1         | active |
    And the labels table contains:
      | id | name | color | status |
    And the label_entities table contains:
      | label_id | entity_type | entity_id |
    And the search_index table contains:
      | entity_type | entity_id | content_text   | status |
      | document    | 0200      | vraie histoire | active |
    When I PUT /api/project-documents/projects/0100/documents/0300 with body:
      """
      {"label_names": ["Performance"]}
      """
    Then the response status code is 200
    And the labels table contains:
      | name        |
      | Performance |
    And the label_entities table contains:
      | entity_type | entity_id |
      | document    | 0200      |
    And the search_index table contains:
      | entity_type | entity_id | content_text                                           | status |
      | document    | 0200      | Example de mauvais code Performance vraie histoire     | active |
