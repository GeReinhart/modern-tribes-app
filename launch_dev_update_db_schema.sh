
cd backend


set -a && source .env && set +a && alembic upgrade head

cd ..