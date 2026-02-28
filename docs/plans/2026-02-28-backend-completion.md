# Backend Completion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align the existing FastAPI backend with the Replit frontend's API client, swap OpenAI for Claude Vision, add missing endpoints, add Pinterest auto-posting scheduler, and deploy.

**Architecture:** The backend is 90% built. We're fixing route mismatches, swapping the AI provider, adding 3 missing endpoints, adding a Supabase Storage upload service, and wiring up APScheduler to auto-post pins.

**Tech Stack:** Python FastAPI, Supabase (Postgres + Storage), Anthropic Claude API (Vision), Google Drive API, Pinterest API v5, APScheduler

---

## Route Alignment Map

Frontend `lib/api.ts` expects these paths. Backend currently has mismatches marked with ❌:

| Frontend calls | Method | Backend current | Status |
|---|---|---|---|
| `/auth/google/authorize` | GET | `/auth/google/authorize` | ✅ |
| `/auth/google/status` | GET | `/auth/google/status` | ✅ |
| `/auth/google/disconnect` | POST | `/auth/google/disconnect` | ✅ |
| `/auth/pinterest/authorize` | GET | `/auth/pinterest/authorize` | ✅ |
| `/auth/pinterest/status` | GET | `/auth/pinterest/status` | ✅ |
| `/auth/pinterest/disconnect` | POST | `/auth/pinterest/disconnect` | ✅ |
| `/photos` | GET | `/photos` | ✅ |
| `/photos/{id}` | PATCH | `/photos/{id}` | ✅ |
| `/photos/sync` | POST | `/photos/sync` | ✅ |
| `/photos/stats/summary` | GET | `/photos/stats/summary` | ✅ |
| `/tags/generate/{photoId}` | POST | `/photos/{id}/generate-tags` | ❌ Path mismatch |
| `/tags/{photoId}` | GET | `/photos/{id}/tags` | ❌ Path mismatch |
| `/tags/{photoId}` | PUT | `/photos/{id}/tags` | ❌ Path mismatch |
| `/queue` | GET | `/queue` | ✅ |
| `/queue` | POST | `/queue` | ✅ |
| `/queue/bulk` | POST | — | ❌ Missing |
| `/queue/{pinId}/reorder` | PATCH | `/queue/{id}/reorder` | ✅ |
| `/queue/{pinId}` | DELETE | `/queue/{id}` | ✅ |
| `/queue/pause` | POST | `/queue/pause` | ✅ |
| `/queue/resume` | POST | `/queue/resume` | ✅ |
| `/settings` | GET | `/settings` | ✅ |
| `/settings` | PUT | `/settings` | ✅ |
| `/settings/board-mappings` | GET | `/settings/board-mappings` | ✅ |
| `/settings/board-mappings/{cat}` | PUT | `/settings/board-mappings/{cat}` | ✅ |
| `/settings/pinterest-boards` | GET | — | ❌ Missing |

---

## Parallel Task Groups

These 6 tasks are **independent** and can run in parallel:

### Task 1: Fix Tag Router Paths
**Files:** `backend/app/routers/tags.py`, `backend/app/main.py`

Move tag endpoints from nested under `/photos` to standalone `/tags` prefix to match frontend:
- `POST /tags/generate/{photo_id}` — generate AI tags
- `GET /tags/{photo_id}` — get tags for photo
- `PUT /tags/{photo_id}` — update tags for photo

Change router prefix in `main.py` from photos-nested to `/tags`.

### Task 2: Swap OpenAI → Claude Vision
**Files:** `backend/app/services/openai_vision.py` → rename to `backend/app/services/claude_vision.py`, `backend/app/routers/tags.py`, `backend/requirements.txt`, `backend/app/config.py`

Replace OpenAI Vision with Anthropic Claude API:
- Remove `openai` from requirements, add `anthropic>=0.43.0`
- Replace `OPENAI_API_KEY` with `ANTHROPIC_API_KEY` in config
- Rewrite vision service to use `claude-sonnet-4-6` with image input
- Keep same prompt logic and board suggestion mapping
- Same return format: `{ tags: string[], board_suggestion: string }`

### Task 3: Add Missing Endpoints
**Files:** `backend/app/routers/queue.py`, `backend/app/routers/settings.py`

Add two missing endpoints:
1. `POST /queue/bulk` — bulk approve photos and add to queue
   - Body: `{ photo_ids: string[] }`
   - For each photo: set status=approved, create scheduled_pin with auto-calculated time
   - Uses board from tags → board_mappings lookup
2. `GET /settings/pinterest-boards` — fetch user's Pinterest boards
   - Uses stored Pinterest access token
   - Calls Pinterest API `GET /boards`
   - Returns `[{ id, name }]`

### Task 4: Add Supabase Storage Service
**Files:** Create `backend/app/services/storage.py`, modify `backend/app/services/google_drive.py`

Pinterest needs public image URLs. Google Drive URLs require auth. Solution:
- During sync, download image from Drive → upload to Supabase Storage bucket `pin-images`
- Store public URL in `photos.storage_url`
- Pinterest posting uses `storage_url` instead of `drive_url`

### Task 5: Add Pinterest Posting Scheduler
**Files:** Create `backend/app/services/scheduler.py`, modify `backend/app/main.py`, `backend/requirements.txt`

Add APScheduler to auto-post pins:
- Add `apscheduler>=3.10.0` to requirements
- Create scheduler service that runs every 5 minutes
- Checks for pins where `scheduled_for <= now()` AND `posted_at IS NULL` AND `paused = FALSE`
- For each due pin: call Pinterest API `POST /pins` with image URL, title, description, board_id
- On success: set `posted_at`, store `pinterest_pin_id`, update photo status to `posted`
- On failure: log error, retry next cycle (max 3 retries)
- Start scheduler in FastAPI lifespan startup
- Stop scheduler in FastAPI lifespan shutdown

### Task 6: Create Supabase Database Schema
**Files:** Create `backend/database/schema.sql`

Write the complete SQL schema for Supabase:
- `settings` table (single-row with fixed UUID)
- `photos` table with status enum and unique drive_file_id
- `tags` table with FK to photos, cascade delete
- `scheduled_pins` table with FK to photos
- `board_mappings` table with pre-seeded categories
- All indexes
- Storage bucket creation

---

## Post-Parallel: Integration & Deploy

### Task 7: CORS & Environment Updates
**Files:** `backend/app/main.py`, `backend/app/config.py`, `backend/.env.example`

- Add Vercel frontend URL to CORS origins
- Update .env.example with all current env vars
- Ensure ANTHROPIC_API_KEY replaces OPENAI_API_KEY

### Task 8: Deploy Backend to Railway
- Push backend to GitHub
- Connect Railway to the repo
- Set environment variables
- Deploy and verify all endpoints respond

---
