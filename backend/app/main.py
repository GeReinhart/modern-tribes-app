from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from pathlib import Path
from .core.config import settings
from .core.database import connect_to_postgres, close_postgres_connection
from fastapi.staticfiles import StaticFiles
from .routers.uploads import (
    uploads,
)
from .routers.crud import (
    roles,
    users,
    permissions,
    persons,
    tribes as crud_tribes,
    positions,
    labels,
    label_entities,
    projects,
    documents,
    document_entities

)
from .routers.auth import authentification
from .routers.auth import authorization
from .routers.app import tribes_with_positions
from .routers.query import (
    tribes as query_tribes,
    users as query_users,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for startup and shutdown events"""
    # Startup
    logger.info("Starting application...")
    await connect_to_postgres()

    # Create upload directories
    Path(settings.UPLOAD_DIR).mkdir(exist_ok=True)
    Path(f"{settings.UPLOAD_DIR}/images").mkdir(exist_ok=True)
    Path(f"{settings.UPLOAD_DIR}/files").mkdir(exist_ok=True)

    logger.info("Application started successfully")

    yield

    # Shutdown
    logger.info("Shutting down application...")
    await close_postgres_connection()
    logger.info("Application stopped")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Mount static files (uploads)
app.mount(
    "/uploads",
    StaticFiles(directory=settings.UPLOAD_DIR),
    name="uploads"
)

# Include routers
app.include_router(users.router, prefix="/api/crud")
app.include_router(roles.router, prefix="/api/crud")
app.include_router(permissions.router, prefix="/api/crud")
app.include_router(persons.router, prefix="/api/crud")
app.include_router(crud_tribes.router, prefix="/api/crud")
app.include_router(positions.router, prefix="/api/crud")
app.include_router(labels.router, prefix="/api/crud")
app.include_router(label_entities.router, prefix="/api/crud")
app.include_router(projects.router, prefix="/api/crud")
app.include_router(documents.router, prefix="/api/crud")
app.include_router(document_entities.router, prefix="/api/crud")
app.include_router(uploads.router)

app.include_router(authentification.router, prefix="/api", tags=["auth"])
app.include_router(authorization.router, prefix="/api", tags=["auth"])

app.include_router(tribes_with_positions.router, prefix="/api")


app.include_router(query_tribes.router, prefix="/api/query")
app.include_router(query_users.router, prefix="/api/query")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info" if settings.DEBUG else "warning"
    )
