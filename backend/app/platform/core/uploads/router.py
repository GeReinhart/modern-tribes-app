import logging
import uuid

from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse

from app.platform.core.uploads.files import UploadFileResponse
from app.platform.core.uploads.file_handler import file_handler

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/uploads", tags=["upload"])


@router.post("/image")
async def upload_image(request: Request):
    """
    Upload image for Jodit editor - accepts any field name

    Returns URL in Jodit-compatible format
    """
    try:
        form = await request.form()

        # Get the first file from the form, regardless of field name
        file = None
        for key in form:
            if hasattr(form[key], "filename"):
                file = form[key]
                break

        if not file:
            return JSONResponse(status_code=400, content={"error": 1, "message": "No file uploaded"})

        # Save image
        filename, _ = await file_handler.save_image(file)

        # Generate URL
        url = file_handler.get_file_url(filename, "images")

        return JSONResponse(status_code=200, content={"error": 0, "message": "Upload successful", "url": url})

    except HTTPException as e:
        logger.warning("upload_image HTTPException: status=%d detail=%s", e.status_code, e.detail)
        return JSONResponse(status_code=e.status_code, content={"error": 1, "message": e.detail})
    except Exception as e:
        logger.exception("upload_image unhandled error: %s", e)
        return JSONResponse(status_code=500, content={"error": 1, "message": f"Upload failed: {str(e)}"})


@router.post("/file", response_model=UploadFileResponse)
async def upload_file(file: UploadFile = File(...)):
    """
    Upload file attachment

    Returns file information including URL
    """
    try:
        # Save file
        filename, file_size, mime_type = await file_handler.save_file(file)

        # Generate URL
        url = file_handler.get_file_url(filename, "files")

        return UploadFileResponse(
            url=url, name=file.filename, size=file_size, type=mime_type, id=uuid.uuid4().hex
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
