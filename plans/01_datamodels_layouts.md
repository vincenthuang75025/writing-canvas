# Plan: Implement Writing Canvas Spec

## Context
Implement the full product spec: custom canvas nodes (Vibes, Sketches, Snippets) on tldraw, a document editor panel, abstraction-level filtering, backend persistence, and AI generation features.

## Implementation Order

### 1. Data Model + Backend API
- Pydantic models for nodes (id, type, content, x, y, w, h) and document (TipTap JSON)
- JSON-file persistence (simple, upgrade to DB later)
- CRUD endpoints: `GET/POST/PUT/DELETE /nodes`, `GET/PUT /document`
- AI endpoints: `POST /ai/suggest` (Gemini Flash), `POST /ai/rewrite` (Claude Opus)

### 2. Custom tldraw Shapes
- Three ShapeUtil subclasses: VibeShape, SketchShape, SnippetShape
- Each has distinct color/styling, editable text content
- Register all three with `<Tldraw shapeUtils={[...]} />`

### 3. Single-Page Layout
- Canvas takes most of viewport, document editor in a toggleable right panel
- Abstraction level filter control overlaid on canvas (segmented buttons: 1/2/3)
- Uses tldraw's `getShapeVisibility` to hide/show by abstraction level

### 4. Persistence Sync
- On canvas changes (store.listen), POST/PUT to backend
- On load, GET nodes from backend and populate tldraw store
- Editor content synced to backend on change (debounced)

### 5. AI Features
- Context menu / button on selected nodes to trigger generation
- "Suggest from this" generates a new node at the next abstraction level
- "Rewrite passage" sends snippet + document selection to Claude Opus

## Verification
- Create vibes, sketches, snippets on canvas with distinct visual styles
- Toggle abstraction levels and see shapes hide/show
- Type in document editor, reload and see content persisted
- Select a vibe node, trigger AI suggest, see a new sketch node appear
