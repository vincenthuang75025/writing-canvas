# Plan: Editor Support Improvements

Implements `specs/editor_support.md` — better editor layout, style references, and two AI-powered rewrite features (Cmd+K inline rewrite, Cmd+L style-guided rewrite).

## 1. Editor Layout Overhaul

**Current**: Editor view has a canvas nodes column (left 25%) + TipTap editor (right 75%) + ChatPanel (right 400px).

**New**: Editor view has style references column (left ~300px) + TipTap editor (center, flex) + optional chat panel (right, hidden by default, shown on Cmd+L).

### Style References Column
- 4 `<textarea>` elements stacked vertically, each `flex: 1` to fill the full height equally.
- Each has a subtle label ("Reference 1", "Reference 2", etc.) and placeholder text.
- Debounced save (1s) to backend on change, same pattern as document sync.

### Page-level changes (`page.tsx`)
- In editor mode: remove the always-visible `<ChatPanel />` on the right.
- Instead, conditionally render a right panel when `showStyleChat` state is true (triggered by Cmd+L).

## 2. Style References Persistence

### Backend
- **Schema** (`schemas.py`): Add `style_references: list[str]` field to `ProjectData` with default `["", "", "", ""]`.
- **Storage** (`storage.py`): Add `get_style_references()` and `update_style_references(refs: list[str])` helpers.
- **Router** (`routers/style_references.py`): New router with:
  - `GET /style-references` → returns `{"references": ["...", "...", "...", "..."]}`
  - `PUT /style-references` → accepts `{"references": [...]}`, saves and returns
- **Register** in `main.py`.

### Frontend
- **API** (`api.ts`): Add `fetchStyleReferences()` and `updateStyleReferences(refs: string[])`.
- **Editor component**: Fetch on mount, debounced save on textarea change.

Since style references are part of `ProjectData`, they automatically get included in state snapshots (Save State / STATE.json) with no extra work.

## 3. Cmd+K — Inline Rewrite

### Interaction flow
1. User selects text in TipTap editor, presses Cmd+K.
2. A floating popup appears near the selection with a text input and "Rewrite" button.
3. User types an instruction, presses Enter or clicks Rewrite.
4. Backend call → LLM rewrites the selected text per the instruction.
5. Result appears in the popup below the input. User can copy it or dismiss.
6. Pressing Escape or clicking outside dismisses the popup.

### Backend
- **Endpoint**: `POST /ai/rewrite` in `routers/ai.py`
  ```
  { "selected_text": "...", "instruction": "..." }
  → { "rewritten_text": "..." }
  ```
- **LLM**: Gemini Flash (fast, simple rewrite task).

### Frontend
- In `Editor.tsx`, add a keyboard listener on the TipTap editor for Cmd+K.
- When triggered with a selection, capture `{ text, from, to }` and show a floating div.
- Position the popup using `editor.view.coordsAtPos(from)` to get screen coordinates.
- On submit, call `POST /ai/rewrite`, show result in the popup.
- The popup is a piece of React state in the Editor component: `cmdKState: null | { text, from, to, instruction, result, loading }`.

## 4. Cmd+L — Style-Guided Rewrite Chat

### Interaction flow
1. User selects text, presses Cmd+L.
2. If no style references are filled in, show an alert/toast. Otherwise:
3. A panel slides in on the right (similar to ChatPanel but specialized).
4. If multiple style references are non-empty, show a dropdown to pick one. If only one, auto-select.
5. Phase 1 — **Analyze**: Auto-fires a backend call with selected text + chosen style reference. LLM returns a list of stylistic elements (diction, rhythm, imagery, etc.). Rendered as a checklist with all items checked by default.
6. User can uncheck elements they don't want applied.
7. User clicks "Rewrite" button.
8. Phase 2 — **Rewrite**: Backend call with selected text + style reference + only checked elements. LLM returns rewritten text, displayed in the panel.

### Backend
- **Endpoint 1**: `POST /ai/style-analyze` in `routers/ai.py`
  ```
  { "selected_text": "...", "style_reference": "..." }
  → { "elements": ["Sparse, clipped diction", "Short declarative sentences", ...] }
  ```
  LLM: Claude Sonnet (needs literary judgment). Prompt asks for a JSON array of stylistic markers.

- **Endpoint 2**: `POST /ai/style-rewrite` in `routers/ai.py`
  ```
  { "selected_text": "...", "style_reference": "...", "elements": ["...", "..."] }
  → { "rewritten_text": "..." }
  ```
  LLM: Claude Sonnet (needs care with style).

### Frontend
- New component: `StyleChat.tsx` — manages the two-phase flow.
  - Props: `selectedText`, `styleReferences`, `onClose`.
  - Internal state: `phase` ("select" | "analyze" | "checklist" | "rewrite" | "done"), `elements`, `checkedElements`, `rewrittenText`.
- In `Editor.tsx`, Cmd+L sets `styleChatState: { text } | null`, which toggles the panel.
- `page.tsx` editor mode conditionally renders `<StyleChat>` in the right panel slot.

## 5. File Changes Summary

### New files
- `backend/app/routers/style_references.py` — GET/PUT style references
- `frontend/src/components/StyleChat.tsx` — Cmd+L style rewrite panel

### Modified files
- `backend/app/models/schemas.py` — add `style_references` to `ProjectData`
- `backend/app/services/storage.py` — add style reference helpers
- `backend/app/routers/ai.py` — add `/ai/rewrite`, `/ai/style-analyze`, `/ai/style-rewrite`
- `backend/app/main.py` — register style_references router
- `frontend/src/lib/api.ts` — add style reference + AI rewrite API calls
- `frontend/src/components/Editor.tsx` — new layout, Cmd+K popup, Cmd+L trigger, style reference textareas
- `frontend/src/app/page.tsx` — remove default chat in editor mode, add conditional StyleChat panel
- `CODE_OVERVIEW.md` — update to reflect new structure
