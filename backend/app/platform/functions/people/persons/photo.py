from io import BytesIO

from fastapi import HTTPException
from PIL import Image, ImageOps

PHOTO_SIZE = 256
PHOTO_FOLDER = "avatars"


def square_webp(content: bytes, size: int = PHOTO_SIZE) -> bytes:
    """Center-crop an image to a square, scale it to `size` px and encode it as WebP."""
    try:
        image = Image.open(BytesIO(content))
        image = ImageOps.exif_transpose(image).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")
    squared = ImageOps.fit(image, (size, size), Image.LANCZOS)
    out = BytesIO()
    squared.save(out, format="WEBP", quality=85)
    return out.getvalue()


def filename_from_url(photo_url: str) -> str:
    return photo_url.rsplit("/", 1)[-1]
