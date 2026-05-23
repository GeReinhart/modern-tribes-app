# Agent Coding Guidelines


## Frontend

### Technical stack

- **React** - UI library
- **TypeScript** - Language
- **Vite** - Build tool
- **TailwindCSS** - Utility-first CSS framework
- **PWA** - Progressive Web App support

### Code Organization Rules

- **Never use `any`.** Type everything explicitly.
- **API calls must not live in components.** They belong in dedicated service files.
- **Shared stateful logic must be extracted into a custom hook**, not duplicated across components.
- **Reusable UI elements must be extracted into a shared component** as soon as they appear in more than one place.
- **A React component file must not exceed 200 lines.** If it does, extract sub-components or hooks.
- **No logic inside JSX.** Extract conditions and transformations into variables or functions above the return statement.

### Files and directories

- frontend: all the frontend
- frontend/src: all the frontend code

- frontend/dist: do not look here
- frontend/node_modules: do not look here

## Dependencies

- All dependencies must be declared in `package.json` and pinned to specific versions.

## Themes

The frontend layout is based on Themes UI. All the elements presented should have the current theme applied

## Layout

- When there are some tabs in a page, we can access to the tab through the url and bread crump as if it's some subpages. 
   - use `@/hooks/useUrlTab` 
   - like in DashBoradPage.tsx, ShowTribePage.tsx

## Enum

- **MUST** - When an Enum is defined on the backend, it must be defined on the frontend as well under `frontend/src/types` and we must use only the Enum.

## New page

- When creating a new page, make sure it can be added in the bookmarks
- Use the front/db mapping of the ids