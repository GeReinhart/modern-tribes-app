# Setup PROD

## Setup the remote database

### Create the database and init the data
- Populate the files in backend/scripts/data-prod as needed
- Run the init_db.py script

```bash
python -m dotenv -f .env.prod run -- python backend/scripts/init_db.py --data-dir backend/scripts/data-prod
```


### Update the schema

- Run the alembic upgrade head command
```bash
cd backend
set -a && source .env.prod && set +a && alembic upgrade head
```

## Run the backend from local connected to remote database

- Build the image

```bash
podman build -f Dockerfile.backend -t modern-tribes-backend .
 ```

- Run with .env.prod
```bash
podman run --env-file .env.prod -p 8000:8000 modern-tribes-backend
```
