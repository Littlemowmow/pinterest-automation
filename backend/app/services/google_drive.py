import io
import logging

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from google.auth.transport.requests import Request
from typing import List, Dict

from app.config import settings
from app.services.storage import ensure_bucket_exists, upload_image_to_storage

logger = logging.getLogger(__name__)

SETTINGS_ID = "00000000-0000-0000-0000-000000000001"


class GoogleDriveService:
    def __init__(self, access_token: str, refresh_token: str = None):
        """Initialize Google Drive service with OAuth tokens."""
        self.credentials = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.google_client_id,
            client_secret=settings.google_client_secret,
        )

        if self.credentials.expired and self.credentials.refresh_token:
            self.credentials.refresh(Request())

        self.service = build("drive", "v3", credentials=self.credentials)

    def list_images_in_folder(self, folder_id: str) -> List[Dict]:
        """List all image files in a Google Drive folder."""
        query = f"'{folder_id}' in parents and mimeType contains 'image/' and trashed = false"
        results = []
        page_token = None

        while True:
            response = self.service.files().list(
                q=query,
                spaces="drive",
                fields="nextPageToken, files(id, name, mimeType, webContentLink, webViewLink, thumbnailLink, createdTime)",
                pageToken=page_token,
                pageSize=100,
            ).execute()

            results.extend(response.get("files", []))
            page_token = response.get("nextPageToken")
            if not page_token:
                break

        return results

    def download_file_bytes(self, file_id: str) -> bytes:
        """Download the full file content from Google Drive as bytes."""
        request = self.service.files().get_media(fileId=file_id)
        buffer = io.BytesIO()
        downloader = MediaIoBaseDownload(buffer, request)
        done = False
        while not done:
            _, done = downloader.next_chunk()
        return buffer.getvalue()

    def get_file_download_url(self, file_id: str) -> str:
        return f"https://drive.google.com/uc?export=view&id={file_id}"

    def get_file_thumbnail(self, file_id: str) -> str:
        return f"https://drive.google.com/thumbnail?id={file_id}&sz=w400"


async def sync_photos_from_drive(supabase, folder_id: str) -> Dict:
    """Sync photos from Google Drive folder to database and Supabase Storage."""
    settings_result = supabase.table("settings").select(
        "google_access_token, google_refresh_token"
    ).eq("id", SETTINGS_ID).single().execute()

    if not settings_result.data or not settings_result.data.get("google_access_token"):
        return {"error": "Google Drive not connected", "synced": 0}

    access_token = settings_result.data["google_access_token"]
    refresh_token = settings_result.data.get("google_refresh_token")

    try:
        drive_service = GoogleDriveService(access_token, refresh_token)
        files = drive_service.list_images_in_folder(folder_id)
    except Exception as e:
        return {"error": f"Failed to list files: {str(e)}", "synced": 0}

    # Ensure storage bucket exists
    try:
        await ensure_bucket_exists(supabase)
    except Exception as e:
        logger.error("Storage bucket setup failed: %s", e)

    # Get existing photos to avoid duplicates
    existing = supabase.table("photos").select("drive_file_id").execute()
    existing_ids = {p["drive_file_id"] for p in existing.data}

    synced_count = 0
    for file in files:
        if file["id"] not in existing_ids:
            photo_data = {
                "drive_file_id": file["id"],
                "file_name": file["name"],
                "drive_url": f"https://drive.google.com/uc?export=view&id={file['id']}",
                "thumbnail_url": f"https://drive.google.com/thumbnail?id={file['id']}&sz=w400",
                "status": "new",
            }

            try:
                insert_result = supabase.table("photos").insert(photo_data).execute()
                photo_id = insert_result.data[0]["id"] if insert_result.data else None
                synced_count += 1
            except Exception as e:
                logger.error("Failed to insert photo %s: %s", file["name"], e)
                continue

            # Download from Drive and upload to Supabase Storage
            try:
                file_bytes = drive_service.download_file_bytes(file["id"])
                storage_url = await upload_image_to_storage(
                    supabase=supabase,
                    file_bytes=file_bytes,
                    file_name=file["name"],
                    drive_file_id=file["id"],
                )
                if photo_id:
                    supabase.table("photos").update(
                        {"storage_url": storage_url}
                    ).eq("id", photo_id).execute()
            except Exception as e:
                logger.error("Failed to upload %s to storage: %s", file["name"], e)

    return {"synced": synced_count, "total_in_folder": len(files)}
