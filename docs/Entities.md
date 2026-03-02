# Entities


## Authorisation and main entities

### Role and Permission

- `Role`: abstraction of a user role, what the user can do
  - `name`
     - possible settings in db:
        - 'Admin' => attach all permissions
        - 'AdvancedUser' => attached some permissions so that the user can initiate a tribe 
           - In particular,
              - 'can_crud_own_tribes'
              - 'can_crud_own_users'
              - 'can_crud_own_persons'
              - 'can_crud_own_positions'
        - 'User' => attached some permissions so that the user can access to his tribes. The possible action will depend on its position in the tribe.
           - In particular,
              - 'can_read_attached_tribes'
        - Depends on the position of the person in the tribe (souldn't be attached directly to the `User`):
           - 'TribeChief' => attached some permissions to manage the tribe
              - In particular,
                 - 'can_crud_tribe_projects'
           - 'TribeMember' => attached some permissions to participate in the tribe
              - In particular,
                 - 'can_update_tribe_projects'
                 - 'can_read_tribe_projects'
           - 'TribeInvite' => attached some permissions to be informed by the tribe
              - In particular,
                 - 'can_read_tribe_projects'
  - `description`
  - -> `permissions`: `Permission`[]
- `Permission`: what the user can do
  - `code`: refers to a hardcoded list of strings that define what can be done on the application
    - 'can_crud_own_tribes'
    - 'can_crud_own_users'
    - 'can_crud_own_persons'
    - 'can_crud_own_positions'
    - 'can_crud_tribe_projects'
    - 'can_read_attached_tribes': be able to access to tribes to which the user has a position
    - 'can_update_tribe_projects'
    - 'can_read_tribe_projects' 
    - ...
    - explanations
      - 'can_crud_%' means be able to create read update delete on an entity
      - '%_own_%' means entity created by the user 
      - '%_tribe_%' means entity of the tribes the person has a position 
  - `description`

### User, Role and Person

- `User`: actual user of the application
  - `login`
  - `email`: email of the user where the authentication link will be sent
  - -> `roles` : `Roles`[]
  - ->? `person`: `Person`: the person in the application that is also the user of the application

- `Person`: person in the application
  - `firstName`
  - `lastName`
  - `gender`
  - `birthDay`

### Tribe and Person

- `Tribe`
  - `name`
  - -> `document`: `Document`

- `Position`
  - -> `person`: `Person`
  - -> `tribe`: `Tribe`
  - `position` : 'chief' | 'member' | 'invite'
    - from this position, the user will be allowed different permissions on the tribe 


## Label and Document

- Label
    - name
  
- LabelEntity
    - -> label: Label
    - ->? person: Person
    - ->? projet: Project
    - ->? document: Document

- Document
    - title
    - contentHtml
    - files: File[]
    - images: Image[]

- DocumentEntity
    - -> document: Document
    - ->? project: Project
    - ->? document: Document

## Entities in a tribe

- Project
    - name
    - ->? owner: Person
    - -> document: Document
