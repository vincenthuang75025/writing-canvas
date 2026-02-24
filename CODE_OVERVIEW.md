# Writing Canvas — Code Overview

A collaborative writing canvas app that helps authors develop ideas from high-level themes ("vibes") through sketches and snippets down to finished prose, using an infinite canvas (tldraw) and a document editor (TipTap).

## Project Structure

```
writing_canvas/
├── specs/              # Product specs and requirements
│   └── overview.md     # High-level product vision
├── plans/              # Implementation plans
├── backend/            # Python/FastAPI backend
│   ├── pyproject.toml  # Dependencies managed by uv
│   ├── .env            # API keys (gitignored)
│   ├── data/           # JSON persistence (gitignored, auto-created)
│   │   └── project.json
│   └── app/
│       ├── main.py         # FastAPI app, CORS middleware, router registration
│       ├── models/
│       │   └── schemas.py  # Pydantic models: CanvasNode, Document, ProjectData
│       ├── routers/
│       │   ├── health.py   # GET /health
│       │   ├── nodes.py    # CRUD: GET/POST/PUT/DELETE /nodes
│       │   ├── document.py # GET/PUT /document (TipTap JSON)
│       │   └── ai.py       # POST /ai/suggest, POST /ai/rewrite
│       └── services/
│           ├── storage.py  # JSON-file persistence for nodes + document
│           └── ai.py       # Gemini Flash (suggest) + Claude Opus (rewrite)
├── frontend/           # Next.js/React frontend
│   ├── package.json
│   ├── next.config.ts  # tldraw in serverExternalPackages
│   └── src/
│       ├── app/
│       │   ├── layout.tsx      # Root layout with Geist fonts + Tailwind
│       │   ├── page.tsx        # Single-page layout: Canvas + Editor panel + abstraction filter
│       │   └── globals.css     # Tailwind + tldraw CSS imports
│       ├── components/
│       │   ├── Canvas.tsx      # tldraw wrapper with custom shapes, persistence sync, AI suggest
│       │   ├── Editor.tsx      # TipTap editor with persistence sync + AI rewrite panel
│       │   ├── HealthCheck.tsx # Backend connectivity indicator
│       │   └── shapes/
│       │       ├── index.ts            # Re-exports all shape utils
│       │       ├── types.ts            # ABSTRACTION_LEVELS constant
│       │       ├── VibeShapeUtil.tsx    # Pastel purple cards (level 1, most abstract)
│       │       ├── SketchShapeUtil.tsx  # Pastel yellow cards (level 2)
│       │       └── SnippetShapeUtil.tsx # Pastel green cards (level 3)
│       └── lib/
│           └── api.ts  # API client for all backend endpoints
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

### Abstraction Level Filter
A segmented control in the top-left of the canvas lets users filter by abstraction level (1/2/3). Shapes above the selected level are hidden (opacity 0).

### Single-Page Layout
- Canvas fills most of the viewport.
- A toggleable right panel (400px) contains the TipTap document editor.
- The editor includes an "AI Rewrite" panel at the bottom.

### Persistence
- Canvas nodes and document content are synced to the backend via REST API.
- Backend stores everything in a single `data/project.json` file.
- Canvas changes are debounced (1s) before syncing. Document changes similarly debounced.

### AI Features
- **AI Suggest** (toolbar button): Select a node, click "AI Suggest" to generate a new node at the next abstraction level. Uses Gemini Flash.
- **AI Rewrite** (editor panel): Select text in the editor, paste a snippet/reference, click "Rewrite Selection" to rewrite the passage in that style. Uses Claude Opus.

## Key Technical Details

- **Canvas and Editor components** are loaded with `next/dynamic` + `ssr: false` since tldraw and TipTap require browser APIs.
- **Custom shapes** use `ShapeUtil<any>` due to tldraw v4's closed type union for `TLShape`. Runtime behavior is correct.
- **CORS** is configured on the backend to allow requests from `localhost:3000`.
- **TipTap** uses `immediatelyRender: false` to avoid SSR hydration mismatches.
- **Backend deps**: FastAPI, Pydantic, Anthropic SDK, Google GenAI SDK, python-dotenv.
- **Frontend deps**: Next.js 16 (App Router), Tailwind CSS, tldraw v4, TipTap v3 (react + starter-kit).
