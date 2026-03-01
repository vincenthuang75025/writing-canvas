# Plan: State Persistence via STATE.json

## Context

The server is restarted frequently during development. The existing `data/project.json` lives in a gitignored directory and can be lost or stale. The spec asks for a user-triggered snapshot mechanism: a button that dumps the full canvas state to `STATE.json` in the **project root** (trackable in git), and on server boot, the server loads from `STATE.json` if present to restore canvas state.

## Changes

### 1. Backend: Add snapshot save/load functions to storage service

**File:** `backend/app/services/storage.py`

Add a `STATE_FILE` constant pointing to the project root's `STATE.json` (two levels up from the `app/services/` directory, same level as `backend/`... actually, the project root is one level above `backend/`). We need to resolve this carefully — the project root is the parent of `backend/`.

- `save_state_snapshot()`: Reads current `ProjectData` via `load_project()`, writes it to `STATE_FILE` as JSON.
- `load_state_snapshot()`: If `STATE_FILE` exists, reads it, validates as `ProjectData`, and writes it into `data/project.json` via `save_project()` so the rest of the app works as-is.

### 2. Backend: Load STATE.json on startup

**File:** `backend/app/main.py`

Add a `lifespan` context manager (FastAPI's recommended pattern) that calls `storage.load_state_snapshot()` on startup. This copies `STATE.json` contents into `data/project.json` so existing storage operations work unchanged.

### 3. Backend: Add state router

**File:** `backend/app/routers/state.py` (new)

Single endpoint: `POST /state/save` → calls `storage.save_state_snapshot()`, returns `{"status": "ok"}`.

Register the router in `main.py`.

### 4. Frontend: Add API function

**File:** `frontend/src/lib/api.ts`

Add `saveState()` function that POSTs to `/state/save`.

### 5. Frontend: Add "Save State" button

**File:** `frontend/src/app/page.tsx`

Add a button in the top-left controls area (near the abstraction level filter, or as a separate small button). Clicking it calls `saveState()` and shows brief feedback (e.g., button text changes to "Saved!" briefly).

## Files to modify
- `backend/app/services/storage.py` — add `STATE_FILE`, `save_state_snapshot()`, `load_state_snapshot()`
- `backend/app/main.py` — add lifespan handler, register state router
- `backend/app/routers/state.py` — new file, `POST /state/save`
- `frontend/src/lib/api.ts` — add `saveState()`
- `frontend/src/app/page.tsx` — add save state button
- `CODE_OVERVIEW.md` — mention STATE.json and the new router

## Verification
1. Start backend (`cd backend && uv run fastapi dev app/main.py`)
2. Start frontend (`cd frontend && npm run dev`)
3. Add some nodes on the canvas, type some text
4. Click "Save State" button — verify `STATE.json` appears in project root with node data
5. Restart the backend server
6. Reload the frontend — verify nodes/positions are restored from the snapshot
