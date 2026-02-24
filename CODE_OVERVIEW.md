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
│   └── app/
│       ├── main.py         # FastAPI app, CORS middleware, router registration
│       ├── routers/
│       │   └── health.py   # GET /health endpoint
│       ├── models/         # Pydantic models (empty, for future use)
│       └── services/       # Business logic (empty, for future use)
├── frontend/           # Next.js/React frontend
│   ├── package.json
│   ├── next.config.ts  # tldraw in serverExternalPackages
│   └── src/
│       ├── app/
│       │   ├── layout.tsx      # Root layout with Geist fonts + Tailwind
│       │   ├── page.tsx        # Canvas page (/) — tldraw + health check indicator
│       │   ├── editor/
│       │   │   └── page.tsx    # Editor page (/editor) — TipTap
│       │   └── globals.css     # Tailwind + tldraw CSS imports
│       └── components/
│           ├── Canvas.tsx      # 'use client' tldraw wrapper (full-viewport)
│           ├── Editor.tsx      # 'use client' TipTap wrapper with StarterKit
│           └── HealthCheck.tsx # 'use client' backend connectivity indicator
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

## Key Technical Details

- **Canvas and Editor components** are loaded with `next/dynamic` + `ssr: false` since tldraw and TipTap require browser APIs.
- **CORS** is configured on the backend to allow requests from `localhost:3000`.
- **TipTap** uses `immediatelyRender: false` to avoid SSR hydration mismatches.
- **Backend deps**: FastAPI, Pydantic, Anthropic SDK, Google GenAI SDK, python-dotenv.
- **Frontend deps**: Next.js 16 (App Router), Tailwind CSS, tldraw, TipTap (react + starter-kit).
