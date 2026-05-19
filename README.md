# Modern Tribes App

## Abstract

The subject is the fact that in our modern way of life we need tools to help us to be more efficient in the way we organize our life, activities.
The term tribe is a nice way of seeing a group of people with a common project.

First, we need to easily define the tribes. One person can be part of several tribes. The tribes can be long-term like a family or short-term to organize a specific event.

We need to differentiate the user and the person. In the case of a child, this person can be represented by an adult.

To be organized, in our various projects we need some tools such as Kanban boards, Planning, Events, Checklists...
From time to time we need specific tools like: car-pooling, groceries list, money management...

## Personal goals

This project is a way to explore several modern technologies to show a certain know how.

This project is also a concert project to experiment and evaluate Gen AI. 

## Common stage

Tag: 0.1.x

The idea is to propose a stack with common feature we would expect in most applications.
From those common features, we will add '~ plugins'. 
The purpose is to be able to fork the repo from this stage to create a new application with already existing common features. 

Features:

- Technical features
    - Authentification through magic link and JWT
    - Authorization through granular permissions 
    - Status of the entities
    - Track who changed the entities
    - I18N
    - UX Themes
    - Power web app to install on mobile devices
    - Send emails
    - Rich text editor with files / images storage
    - Storage of the different revisions of the documents
    - Search full text on documents content
    - Database evolutions
    - Docker packaging
- Functional Features
    - Separate the user and the person
    - A user can represent several people
    - Roles management through roles that can be attached to the users




## Stack

- **Backend**: Python / FastAPI
- **Database**: PostgreSQL (use JSONB and FullText Search)
- **Frontend**: React / TypeScript / Vite / PWA
- **Auth**: Magic link (passwordless) with JWT + refresh tokens

## License

Apache License — see [LICENSE](./LICENSE)
