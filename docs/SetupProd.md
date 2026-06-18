# Setup PROD

## Setup the remote database

### Create the database and init the data
- Populate the files in backend/scripts/data-prod as needed
- Run the init_db.py script

```bash
python -m dotenv -f .env.db.prod run -- python backend/scripts/init_db.py --data-dir backend/scripts/data-prod
```


### Update the schema

- Run the alembic upgrade head command
```bash
cd backend

# Check migration status
set -a && source .env.db.prod && set +a && alembic current


# Migration update
set -a && source .env.db.prod && set +a && alembic upgrade head
```

