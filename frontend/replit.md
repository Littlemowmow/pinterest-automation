# AutoPin - Pinterest Automation Dashboard

## Overview
PinFlow is a Pinterest automation dashboard frontend built with Vite + React + TypeScript. It provides a UI for managing a photo-to-Pinterest posting pipeline: syncing photos from Google Drive, reviewing/tagging them, scheduling pins, and managing board mappings.

## Architecture
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui (Vite)
- **Backend**: Express.js (serves frontend, FastAPI backend to be connected separately)
- **Routing**: wouter (client-side)
- **State**: React local state with mock data fallback
- **Drag & Drop**: @dnd-kit/sortable for queue reordering
- **Toasts**: sonner (bottom-right, 4s auto-dismiss)
- **Theme**: Dark mode only (zinc-950 background, rose-500 accents)

## File Structure
```
client/src/
  lib/
    types.ts         - TypeScript interfaces (Photo, ScheduledPin, Settings, etc.)
    api.ts           - API client (axios, points to FastAPI backend)
    mock-data.ts     - Mock data for all entities
    queryClient.ts   - TanStack Query client config
    utils.ts         - Utility functions
  components/
    app-sidebar.tsx  - Navigation sidebar (PinFlow branding + nav links)
    ui/              - shadcn/ui components
  pages/
    dashboard.tsx    - Stats, schedule, next pin, activity feed
    review.tsx       - Photo review grid with tagging, board selection, approve/skip
    queue.tsx        - Drag-and-drop posting queue with pause/resume
    settings.tsx     - Google/Pinterest connections, posting config, board mappings
  App.tsx            - Root layout with sidebar + routing
```

## Key Dependencies
- axios, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, sonner
- shadcn/ui (Card, Button, Badge, Input, Select, Dialog, Switch, Table, Tabs, Skeleton, Separator)
- lucide-react for icons

## Design Tokens
- Background: bg-zinc-950
- Cards: bg-zinc-900 border-zinc-800
- Text: text-zinc-100 (primary), text-zinc-400 (secondary)
- Accent: rose-500 for primary actions
- Stat accents: blue-500, amber-500, purple-500, green-500

## API Connection
All API calls go through `lib/api.ts` with axios. Currently uses mock data fallback (try/catch pattern). Set `VITE_API_URL` environment variable to connect to the real FastAPI backend.
