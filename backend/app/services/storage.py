import logging
from pathlib import PurePosixPath
from supabase import Client

logger = logging.getLogger(__name__)

BUCKET_NAME = "pin-images"


async def ensure_bucket_exists(supabase: Client) -> None:
    """Create the pin-images bucket if it doesn't exist."""
    try:
        supabase.storage.get_bucket(BUCKET_NAME)
    except Exception:
        try:
            supabase.storage.create_bucket(
                BUCKET_NAME,
                options={
                    "public": True,
                    "allowed_mime_types": ["image/jpeg", "image/png", "image/webp", "image/gif"],
                    "file_size_limit": 20 * 1024 * 1024,
                },
            )
            logger.info("Created public bucket '%s'.", BUCKET_NAME)
        except Exception as e:
            logger.error("Failed to create bucket '%s': %s", BUCKET_NAME, e)
            raise


def _content_type_for(file_name: str) -> str:
    ext = PurePosixPath(file_name).suffix.lower()
    return {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif"}.get(ext, "image/jpeg")


async def upload_image_to_storage(supabase: Client, file_bytes: bytes, file_name: str, drive_file_id: str) -> str:
    """Upload image bytes to Supabase Storage and return public URL."""
    ext = PurePosixPath(file_name).suffix.lower() or ".jpg"
    storage_path = f"{drive_file_id}{ext}"

    supabase.storage.from_(BUCKET_NAME).upload(
        path=storage_path,
        file=file_bytes,
        file_options={"content-type": _content_type_for(file_name), "upsert": "true"},
    )

    public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(storage_path)
    logger.info("Uploaded '%s' -> %s", file_name, public_url)
    return public_url
