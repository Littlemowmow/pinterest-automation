from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from typing import List, Dict, Optional

from app.config import settings

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

        # Refresh if expired
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

            files = response.get("files", [])
            results.extend(files)

            page_token = response.get("nextPageToken")
            if not page_token:
                break

        return results

    def get_file_download_url(self, file_id: str) -> str:
        """Get a direct download URL for a file."""
        # For images, we can use the webContentLink or construct a direct URL
        return f"https://drive.google.com/uc?export=view&id={file_id}"

    def get_file_thumbnail(self, file_id: str) -> str:
        """Get thumbnail URL for a file."""
        return f"https://drive.google.com/thumbnail?id={file_id}&sz=w400"


async def sync_photos_from_drive(supabase, folder_id: str) -> Dict:
    """Sync photos from Google Drive folder to database."""
    # Get OAuth tokens from settings
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

    # Get existing photos to avoid duplicates
    existing = supabase.table("photos").select("drive_file_id").execute()
    existing_ids = {p["drive_file_id"] for p in existing.data}

    # Insert new photos
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
                supabase.table("photos").insert(photo_data).execute()
                synced_count += 1
            except Exception as e:
                print(f"Failed to insert photo {file['name']}: {e}")

    return {"synced": synced_count, "total_in_folder": len(files)}
