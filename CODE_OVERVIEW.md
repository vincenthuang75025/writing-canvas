# Writing Canvas — Code Overview

A collaborative writing canvas app that helps authors develop ideas from high-level themes ("vibes") through sketches and snippets down to finished prose, using an infinite canvas (tldraw), an LLM chat panel, and a document editor (TipTap).

## Project Structure

```
writing_canvas/
├── specs/              # Product specs and requirements
│   ├── overview.md     # High-level product vision
│   └── chat_editor.md  # Chat + Editor panel spec
├── plans/              # Implementation plans
├── STATE.json          # Canvas state snapshot (git-trackable, created via Save State button)
├── backend/            # Python/FastAPI backend
│   ├── pyproject.toml  # Dependencies managed by uv
│   ├── .env            # API keys (gitignored)
│   ├── data/           # JSON persistence (gitignored, auto-created)
│   │   └── project.json
│   └── app/
│       ├── main.py         # FastAPI app, CORS middleware, lifespan handler, router registration
│       ├── models/
│       │   └── schemas.py  # Pydantic models: CanvasNode, Document, ProjectData
│       ├── routers/
│       │   ├── health.py   # GET /health
│       │   ├── nodes.py    # CRUD: GET/POST/PUT/DELETE /nodes
│       │   ├── document.py # GET/PUT /document (TipTap JSON)
│       │   ├── ai.py       # POST /ai/suggest
│       │   ├── chat.py     # POST /chat — streaming SSE chat endpoint (Claude Sonnet)
│       │   └── state.py    # POST /state/save (snapshot to STATE.json)
│       └── services/
│           ├── storage.py  # JSON-file persistence for nodes + document + state snapshots
│           └── ai.py       # Gemini Flash (suggest) + Anthropic client (chat)
├── frontend/           # Next.js/React frontend
│   ├── package.json
│   ├── next.config.ts  # tldraw in serverExternalPackages
│   └── src/
│       ├── app/
│       │   ├── layout.tsx      # Root layout with Geist fonts + Tailwind
│       │   ├── page.tsx        # Single-page layout: Canvas + right panel (Chat/Editor toggle)
│       │   └── globals.css     # Tailwind + tldraw CSS imports
│       ├── components/
│       │   ├── Canvas.tsx      # tldraw wrapper with custom shapes, persistence sync
│       │   ├── ChatPanel.tsx   # LLM chat UI with SSE streaming (connected to /chat endpoint)
│       │   ├── Editor.tsx      # TipTap editor with read-only canvas nodes column
│       │   ├── HealthCheck.tsx # Backend connectivity indicator
│       │   └── shapes/
│       │       ├── index.ts            # Re-exports all shape utils
│       │       ├── types.ts            # ABSTRACTION_LEVELS constant
│       │       ├── VibeShapeUtil.tsx    # Pastel purple cards (level 1, most abstract)
│       │       ├── SketchShapeUtil.tsx  # Pastel yellow cards (level 2)
│       │       └── SnippetShapeUtil.tsx # Pastel green cards (level 3)
│       └── lib/
│           └── api.ts  # API client: nodes, document, AI suggest, chat streaming, state
```

## Running the App

**Backend** (port 8000):
```bash
cd backend
uv run fastapi dev app/main.py
```

**Frontend** (port 3000):
```bash
cd frontend
npm run dev
```

## Key Concepts

### Canvas Node Types
Three custom tldraw shapes at different abstraction levels:
- **Vibe** (level 1): High-level themes/sentiments. Pastel purple card, italic serif text.
- **Sketch** (level 2): Characters, locations, events. Pastel yellow card with label.
- **Snippet** (level 3): Actual prose passages or style references. Pastel green card with label.

### Single-Page Layout
Two main views, switched via a segmented tab control visible in both modes:
- **Chat view** (default): Canvas fills the viewport with a toggleable 400px chat panel on the right. The chat is an LLM conversation connected to Claude, with all canvas node text sent as system context. Session-only history (not persisted).
- **Editor view**: Full-screen document editor (canvas is hidden). A TipTap editor takes up 60% with a read-only column on the left (40%) showing all canvas nodes as colored cards. A top bar provides the view toggle and Save State button.

### Persistence
- Canvas nodes and document content are synced to the backend via REST API.
- Backend stores everything in a single `data/project.json` file (gitignored).
- Canvas changes are debounced (1s) before syncing. Document changes similarly debounced.
- Chat messages are session-only (stored in React state, not persisted to backend).
- **State snapshots**: A "Save State" button in the top-left writes the full canvas state to `STATE.json` in the project root (git-trackable). On server startup, if `STATE.json` exists, it is loaded into `data/project.json` to restore the last saved state.

### AI Features
- **Chat** (right panel): Conversational AI assistant with full canvas context. Uses Claude Sonnet via streaming SSE.

## Key Technical Details

- **Canvas, Editor, and ChatPanel components** are loaded with `next/dynamic` + `ssr: false` since they require browser APIs.
- **Custom shapes** use `ShapeUtil<any>` due to tldraw v4's closed type union for `TLShape`. Runtime behavior is correct.
- **CORS** is configured on the backend to allow requests from `localhost:3000`.
- **TipTap** uses `immediatelyRender: false` to avoid SSR hydration mismatches.
- **Chat streaming**: Backend uses sync Anthropic SDK `messages.stream()` in a sync generator; FastAPI's `StreamingResponse` runs it in a threadpool. Frontend reads the SSE stream via `ReadableStream` + `getReader()`.
- **Nodes polling**: `page.tsx` polls `GET /nodes` every 3s to keep the Editor's nodes column fresh.
- **Backend deps**: FastAPI, Pydantic, Anthropic SDK, Google GenAI SDK, python-dotenv.
- **Frontend deps**: Next.js 16 (App Router), Tailwind CSS, tldraw v4, TipTap v3 (react + starter-kit).
