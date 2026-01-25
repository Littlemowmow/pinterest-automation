from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import httpx
from urllib.parse import urlencode

from app.config import settings
from app.services.supabase_client import get_supabase
from supabase import Client

router = APIRouter(prefix="/auth", tags=["auth"])

SETTINGS_ID = "00000000-0000-0000-0000-000000000001"

# Google OAuth scopes
GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly",
]


def get_google_flow(redirect_uri: str = None) -> Flow:
    """Create Google OAuth flow."""
    return Flow.from_client_config(
        {
            "web": {
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uris": [settings.google_redirect_uri],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=GOOGLE_SCOPES,
        redirect_uri=redirect_uri or settings.google_redirect_uri,
    )


@router.get("/google/authorize")
async def google_authorize():
    """Start Google OAuth flow."""
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    flow = get_google_flow()
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        prompt="consent",
        include_granted_scopes="true",
    )
    return RedirectResponse(auth_url)


@router.get("/google/callback")
async def google_callback(
    code: str = None,
    error: str = None,
    supabase: Client = Depends(get_supabase),
):
    """Handle Google OAuth callback."""
    if error:
        return RedirectResponse(f"{settings.frontend_url}/settings?error={error}")

    if not code:
        return RedirectResponse(f"{settings.frontend_url}/settings?error=no_code")

    try:
        flow = get_google_flow()
        flow.fetch_token(code=code)
        credentials = flow.credentials

        # Store tokens in settings table
        supabase.table("settings").update({
            "google_access_token": credentials.token,
            "google_refresh_token": credentials.refresh_token,
        }).eq("id", SETTINGS_ID).execute()

        return RedirectResponse(f"{settings.frontend_url}/settings?google=connected")

    except Exception as e:
        print(f"Google OAuth error: {e}")
        return RedirectResponse(f"{settings.frontend_url}/settings?error=oauth_failed")


@router.get("/google/status")
async def google_status(supabase: Client = Depends(get_supabase)):
    """Check if Google is connected."""
    result = supabase.table("settings").select("google_access_token").eq("id", SETTINGS_ID).single().execute()

    connected = bool(result.data and result.data.get("google_access_token"))
    return {"connected": connected}


@router.post("/google/disconnect")
async def google_disconnect(supabase: Client = Depends(get_supabase)):
    """Disconnect Google account."""
    supabase.table("settings").update({
        "google_access_token": None,
        "google_refresh_token": None,
    }).eq("id", SETTINGS_ID).execute()

    return {"success": True}


# Pinterest OAuth
@router.get("/pinterest/authorize")
async def pinterest_authorize():
    """Start Pinterest OAuth flow."""
    if not settings.pinterest_app_id or not settings.pinterest_app_secret:
        raise HTTPException(status_code=500, detail="Pinterest OAuth not configured")

    params = {
        "response_type": "code",
        "client_id": settings.pinterest_app_id,
        "redirect_uri": settings.pinterest_redirect_uri,
        "scope": "boards:read,pins:read,pins:write",
        "state": "pinterest_auth",
    }
    auth_url = f"https://api.pinterest.com/oauth/?{urlencode(params)}"
    return RedirectResponse(auth_url)


@router.get("/pinterest/callback")
async def pinterest_callback(
    code: str = None,
    error: str = None,
    supabase: Client = Depends(get_supabase),
):
    """Handle Pinterest OAuth callback."""
    if error:
        return RedirectResponse(f"{settings.frontend_url}/settings?error={error}")

    if not code:
        return RedirectResponse(f"{settings.frontend_url}/settings?error=no_code")

    try:
        # Exchange code for token
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.pinterest.com/v5/oauth/token",
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": settings.pinterest_redirect_uri,
                },
                auth=(settings.pinterest_app_id, settings.pinterest_app_secret),
            )

            if response.status_code != 200:
                print(f"Pinterest token error: {response.text}")
                return RedirectResponse(f"{settings.frontend_url}/settings?error=token_failed")

            token_data = response.json()

        # Store tokens
        supabase.table("settings").update({
            "pinterest_access_token": token_data.get("access_token"),
            "pinterest_refresh_token": token_data.get("refresh_token"),
        }).eq("id", SETTINGS_ID).execute()

        return RedirectResponse(f"{settings.frontend_url}/settings?pinterest=connected")

    except Exception as e:
        print(f"Pinterest OAuth error: {e}")
        return RedirectResponse(f"{settings.frontend_url}/settings?error=oauth_failed")


@router.get("/pinterest/status")
async def pinterest_status(supabase: Client = Depends(get_supabase)):
    """Check if Pinterest is connected."""
    result = supabase.table("settings").select("pinterest_access_token").eq("id", SETTINGS_ID).single().execute()

    connected = bool(result.data and result.data.get("pinterest_access_token"))
    return {"connected": connected}


@router.post("/pinterest/disconnect")
async def pinterest_disconnect(supabase: Client = Depends(get_supabase)):
    """Disconnect Pinterest account."""
    supabase.table("settings").update({
        "pinterest_access_token": None,
        "pinterest_refresh_token": None,
    }).eq("id", SETTINGS_ID).execute()

    return {"success": True}
