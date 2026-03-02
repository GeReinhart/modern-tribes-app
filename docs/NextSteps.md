# Next Steps

## I18N

- [ ] Mechanism to translate the app
- [ ] Command line to get the list of missing translations
- [ ] Command line to generate missing translations

## AAA

- [X] Add authentication (JWT)
    - [ ] Why we have always the same token generated ? verify and access token are the same
- [X] Session management for the `user`
- [X] Magic link by email to be able to connect to the app
  - [X] Have a fake smtp server to send the email
- [X] Add authorization based on `permissions`
  - [X] Crud actions need permission `admin`  
  - [ ] Need to allow actions done by the user on its object
     - [X] on users
     - [X] on persons
     - [ ] find where still needs to be done
          - `/api/query/tribes/by/user`
          -  create a person by tribe id path to replace the get all person from UpdateTribePage.tsx

## UX

- [X] Create a logo in SVG format
- [X] Create a favicon
- [X] Be able to define themes
- [X] Be able to have a proper layout for the app           

## Entities

- [ ] Issue with the document attached to the tribe. Must be an issue str / ObjectId

## Deployment

- [X] Centralize settings in a file (`.env`)
- [X] UI admin on MongoDb
- [ ] Do not duplicate configuration on FrontSide, take it from the API. Example: file extension, size.
- [ ] Package the app in a docker-compose
- [ ] Deploy the app in Clever Cloud
- [ ] Merge on `main`, tag as 0.1.0 so that it can be a start of any project

## Feature TODO list

## Feature Kanban

## Feature planning

## Feature make groceries

## Feature carpooling


