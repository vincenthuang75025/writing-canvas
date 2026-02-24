# Plan: Initial Project Setup

## Context

We're scaffolding a new collaborative writing canvas app from scratch. The goal is to get both the backend and frontend running with core libraries installed, a basic health-check integration proving they can talk to each other, and the canvas + editor libraries rendering.

## Tech Choices

- **Backend**: Python 3.12+, FastAPI, uv
- **Frontend**: Next.js (App Router), Tailwind CSS, npm
- **Canvas**: tldraw
- **Document editor**: TipTap (ProseMirror-based, mature, headless/Tailwind-friendly, good AI integration surface via JSON document model, official Next.js support with `immediatelyRender: false`)

## Project Structure

```
writing_canvas/
  .gitignore
  CODE_OVERVIEW.md
  CLAUDE.md
  specs/
  plans/
  backend/
    pyproject.toml
    .env                      # API keys (gitignored)
    app/
      __init__.py
      main.py                 # FastAPI app, CORS, router includes
      routers/
        __init__.py
        health.py             # GET /health
      models/
        __init__.py
      services/
        __init__.py
  frontend/
    package.json
    next.config.mjs
    src/
      app/
        layout.tsx
        page.tsx              # Canvas page (tldraw)
        editor/
          page.tsx            # Editor page (TipTap)
        globals.css           # Tailwind + tldraw CSS
      components/
        Canvas.tsx            # tldraw wrapper ('use client')
        Editor.tsx            # TipTap wrapper ('use client')
        HealthCheck.tsx       # Fetches backend /health
```

## Implementation Steps

1. **Root setup**: Initialize git, create `.gitignore` covering both projects.

2. **Backend**:
   - `uv init --app` in `backend/`
   - Add deps: `fastapi[standard]`, `pydantic`, `anthropic`, `google-genai`, `python-dotenv`
   - Create `app/main.py` with FastAPI app + CORS middleware (allow `localhost:3000`)
   - Create `app/routers/health.py` with `GET /health` returning `{"status": "ok"}`
   - Create `.env` with placeholder API keys
   - Verify: `uv run fastapi dev` serves on `:8000`, health endpoint works

3. **Frontend**:
   - `npx create-next-app@latest frontend` with TypeScript, Tailwind, ESLint, App Router, src dir
   - Install: `tldraw`, `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`
   - Configure `next.config.mjs` with `serverExternalPackages` for tldraw
   - Import `tldraw/tldraw.css` in `globals.css`
   - Create `Canvas.tsx` (client component wrapping `<Tldraw />`)
   - Create `Editor.tsx` (client component wrapping TipTap with `immediatelyRender: false`)
   - Create `HealthCheck.tsx` (fetches `/health` from backend, shows connection status)
   - Wire up pages: canvas on `/`, editor on `/editor`
   - Verify: `npm run dev` serves on `:3000`, canvas and editor render

4. **Update `CODE_OVERVIEW.md`** to document the structure and how to run each service.

## "It Works" Criteria

- `localhost:8000/health` returns `{"status":"ok"}`
- `localhost:3000/` shows a tldraw canvas (draw, pan, zoom all work)
- `localhost:3000/editor` shows a TipTap editor (type, bold, italic work)
- The canvas page shows a "Backend: connected" indicator confirming CORS + fetch works

## Out of Scope

Canvas node types, persistence, LLM calls, auth, real-time collab, custom tldraw shapes, deployment, tests -- all deferred to future plans.
