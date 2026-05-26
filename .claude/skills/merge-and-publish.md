# merge-and-publish

Run the merge-deploy script to commit, merge into main, push, rebase deploy, and upgrade prod database.

## Usage

`/merge-and-publish "<commit message>"`

## Steps

Ask the user for a commit message if not provided, then run:

```bash
! ./scripts/merge-deploy.sh "<commit message>"
```

Tell the user to run the command above using the `!` prefix so it executes in the session and the output lands in the conversation. Do not run it yourself with the Bash tool — this script pushes to remote branches and upgrades the production database, which requires the user to confirm by running it manually.

Remind the user the script will:
1. Run backend and frontend checks
2. Commit all changes on the current branch
3. Merge into main and push
4. Rebase the deploy branch onto main and force-push
5. Run `alembic upgrade head` against the production database
