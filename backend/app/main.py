from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import asyncio
import logging
import os
import features  # noqa: F401 — triggers feature self-registration
from .core.config import settings
from .services.mail_scheduler import mail_scheduler
from .core.database import connect_to_postgres, close_postgres_connection
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
    represents,
    mails,
    labels,
    label_entities,
    projects,
    documents,
    document_entities,
    app_config,

)
from .routers.auth import authentification
from .routers.auth import authorization
from .routers.app import tribes_with_positions, project_with_document, project_features, project_documents, publications as app_publications
from .routers.public import publications as public_publications
from .routers.query import (
    tribes as query_tribes,
    users as query_users,
    monitoring as query_monitoring,
    mails as query_mails,
    projects as query_projects,
    search as query_search,
    app_config as query_app_config,
    features as query_features,
    my_tasks as query_my_tasks,
    labels as query_labels,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

_scheduler_task: asyncio.Task | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for startup and shutdown events"""
    global _scheduler_task

    logger.info("Starting application...")
    await connect_to_postgres()

    _scheduler_task = asyncio.create_task(mail_scheduler())
    logger.info("Application started successfully")

    yield

    logger.info("Shutting down application...")
    if _scheduler_task:
        _scheduler_task.cancel()
        try:
            await _scheduler_task
        except asyncio.CancelledError:
            pass
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

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception: %s", exc)
    origin = request.headers.get("origin", "")
    headers = {}
    if origin in settings.cors_origins_list:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers=headers,
    )


# Include routers
app.include_router(users.router, prefix="/api/crud")
app.include_router(roles.router, prefix="/api/crud")
app.include_router(permissions.router, prefix="/api/crud")
app.include_router(persons.router, prefix="/api/crud")
app.include_router(crud_tribes.router, prefix="/api/crud")
app.include_router(positions.router, prefix="/api/crud")
app.include_router(represents.router, prefix="/api/crud")
app.include_router(mails.router, prefix="/api/crud")
app.include_router(labels.router, prefix="/api/crud")
app.include_router(label_entities.router, prefix="/api/crud")
app.include_router(projects.router, prefix="/api/crud")
app.include_router(documents.router, prefix="/api/crud")
app.include_router(document_entities.router, prefix="/api/crud")
app.include_router(app_config.router, prefix="/api/crud")
app.include_router(uploads.router)

app.include_router(authentification.router, prefix="/api", tags=["auth"])
app.include_router(authorization.router, prefix="/api", tags=["auth"])

app.include_router(tribes_with_positions.router, prefix="/api")
app.include_router(project_with_document.router, prefix="/api")
app.include_router(project_features.router, prefix="/api")
app.include_router(project_documents.router, prefix="/api")
app.include_router(app_publications.router, prefix="/api")
app.include_router(public_publications.router, prefix="/api")


app.include_router(query_tribes.router, prefix="/api/query")
app.include_router(query_users.router, prefix="/api/query")
app.include_router(query_monitoring.router, prefix="/api/query")
app.include_router(query_mails.router, prefix="/api/query")
app.include_router(query_projects.router, prefix="/api/query")
app.include_router(query_search.router, prefix="/api/query")
app.include_router(query_app_config.router, prefix="/api/query")
app.include_router(query_features.router, prefix="/api/query")
app.include_router(query_my_tasks.router, prefix="/api/query")
app.include_router(query_labels.router, prefix="/api/query")

# Feature routers (registered via features package self-registration)
from features.registry import get_all_routers as _get_feature_routers
for _feature_router in _get_feature_routers():
    app.include_router(_feature_router, prefix="/api/features")

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


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
