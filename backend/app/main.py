import asyncio
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

import app.features  # noqa: F401 — triggers feature self-registration
from app.platform.core.config import settings
from app.platform.core.database import close_postgres_connection, connect_to_postgres
from app.platform.core.authentication.router import router as authentification_router
from app.platform.core.authorization.router import router as authorization_router
from app.platform.core.authorization.roles import router as roles
from app.platform.core.authorization import permissions_router as permissions
from app.platform.core.app_config import router as app_config
from app.platform.core.app_config import query_router as query_app_config
from app.platform.core.uploads import router as uploads
from app.platform.functions.documents import router as documents
from app.platform.functions.documents import entity_router as document_entities
from app.platform.functions.documents import page_router as document_pages
from app.platform.functions.labels import router as labels
from app.platform.functions.labels import entity_router as label_entities
from app.platform.functions.labels import query_router as query_labels
from app.platform.functions.monitoring import router as query_monitoring
from app.platform.functions.people.persons import router as persons
from app.platform.functions.people.users import router as users
from app.platform.functions.people.users import query_router as query_users
from app.platform.functions.people.represents import router as represents
from app.platform.functions.publications import router as app_publications
from app.platform.functions.publications import public_router as public_publications
from app.platform.functions.search import router as search_platform_router
from app.platform.tools.mail import router as mails
from app.platform.tools.mail import query_router as query_mails
from app.platform.tools.mail.scheduler import mail_scheduler
from app.platform.tools.notifications import router as app_notifications
from app.features.bookmarks import router as user_bookmarks
from app.features.dashboard import router as query_my_tasks
from app.features.glue.features import router as project_features
from app.features.glue.features import query_router as query_features
from app.features.glue.tab_config import router as user_tab_configs
from app.features.tribes_projects.positions import router as positions
from app.features.tribes_projects.projects import router as projects
from app.features.tribes_projects.projects import app_router as project_with_document
from app.features.tribes_projects.projects import document_router as project_documents
from app.features.tribes_projects.projects import query_router as query_projects
from app.features.tribes_projects.tribes import router as crud_tribes
from app.features.tribes_projects.tribes import app_router as tribes_with_positions
from app.features.tribes_projects.tribes import query_router as query_tribes

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
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

# Platform — Core
app.include_router(authentification_router, prefix="/api/platform/core")
app.include_router(authorization_router, prefix="/api/platform/core")
app.include_router(roles.router, prefix="/api/platform/core/authorization")
app.include_router(permissions.router, prefix="/api/platform/core/authorization")
app.include_router(app_config.router, prefix="/api/platform/core")
app.include_router(query_app_config.router, prefix="/api/platform/core")
app.include_router(uploads.router, prefix="/api/platform/core")

# Platform — Functions
app.include_router(users.router, prefix="/api/platform/functions/people")
app.include_router(query_users.router, prefix="/api/platform/functions/people")
app.include_router(persons.router, prefix="/api/platform/functions/people")
app.include_router(represents.router, prefix="/api/platform/functions/people")
app.include_router(labels.router, prefix="/api/platform/functions")
app.include_router(label_entities.router, prefix="/api/platform/functions/labels")
app.include_router(query_labels.router, prefix="/api/platform/functions")
app.include_router(documents.router, prefix="/api/platform/functions")
app.include_router(document_entities.router, prefix="/api/platform/functions/documents")
app.include_router(document_pages.router, prefix="/api/platform/functions/documents")
app.include_router(query_monitoring.router, prefix="/api/platform/functions")
app.include_router(app_publications.router, prefix="/api/platform/functions")
app.include_router(public_publications.router, prefix="/api/platform/functions")
app.include_router(search_platform_router.router, prefix="/api/platform/functions")

# Platform — Tools
app.include_router(mails.router, prefix="/api/platform/tools")
app.include_router(query_mails.router, prefix="/api/platform/tools")
app.include_router(app_notifications.router, prefix="/api/platform/tools")

# Features — Bookmarks
app.include_router(user_bookmarks.router, prefix="/api/features")

# Features — Dashboard
app.include_router(query_my_tasks.router, prefix="/api/features")

# Features — Glue
app.include_router(project_features.router, prefix="/api/features/glue")
app.include_router(query_features.router, prefix="/api/features/glue")
app.include_router(user_tab_configs.router, prefix="/api/features/glue")

# Features — Tribes-Projects
app.include_router(crud_tribes.router, prefix="/api/features/tribes-projects")
app.include_router(tribes_with_positions.router, prefix="/api/features/tribes-projects")
app.include_router(query_tribes.router, prefix="/api/features/tribes-projects")
app.include_router(positions.router, prefix="/api/features/tribes-projects")
app.include_router(projects.router, prefix="/api/features/tribes-projects")
app.include_router(project_with_document.router, prefix="/api/features/tribes-projects")
app.include_router(project_documents.router, prefix="/api/features/tribes-projects")
app.include_router(query_projects.router, prefix="/api/features/tribes-projects")

# Features — Tasks (registered via self-registration)
from app.features.registry import get_all_routers as _get_feature_routers

for _feature_router in _get_feature_routers():
    app.include_router(_feature_router, prefix="/api/features/tasks")

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/")
async def root():
    """Root endpoint"""
    return {"name": settings.APP_NAME, "version": settings.APP_VERSION, "status": "running"}


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
        log_level="info" if settings.DEBUG else "warning",
    )
