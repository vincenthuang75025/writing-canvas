# Editor Support — Scratch Notes

## What the spec asks for

1. **Replace simple textarea with TipTap** — Already done. TipTap is already in use.

2. **Editor layout changes:**
   - Remove the canvas nodes list on the left
   - Remove the chat on the right (by default)
   - Add 4 style reference textareas on the left that fill the full height
   - Style references should be persisted in state snapshots

3. **Cmd+K — Inline rewrite popup:**
   - User highlights text, presses Cmd+K
   - A small textbox pops up near the selection
   - User types a rewrite instruction
   - LLM rewrites the highlighted text per the instruction
   - Result shown in the popup (NOT overwriting editor text)

4. **Cmd+L — Style-guided rewrite chat:**
   - User highlights text, presses Cmd+L
   - Opens a chat panel on the right
   - Step 1: LLM reads highlighted text + a style reference, reflects on stylistic markers, outputs a checklist
   - The checklist is rendered with checkboxes (user can toggle)
   - Step 2: User clicks "Rewrite" button → LLM takes highlighted text + style reference + checked items → produces rewritten text in chat

## Design decisions

### Style references persistence
- Need to add `style_references: list[str]` to the `ProjectData` model (or a new field on `Document`)
- Add backend endpoints: GET/PUT `/style-references`
- Frontend: 4 textareas, debounced save like the document

### Cmd+K implementation
- TipTap extension or keyboard listener that detects Cmd+K when text is selected
- Show a floating popup (absolutely positioned near the selection using TipTap's `BubbleMenu` or manual positioning)
- New backend endpoint: POST `/ai/rewrite` — takes `selected_text` + `instruction`, returns rewritten text
- Use Gemini Flash for speed (it's a quick rewrite)

### Cmd+L implementation
- Detect Cmd+L with text selected
- Show the right-side chat panel (hidden by default in editor view)
- Two-phase LLM flow:
  - Phase 1 (analyze): POST `/ai/style-analyze` — takes `selected_text` + `style_reference` → returns list of stylistic elements
  - Phase 2 (rewrite): POST `/ai/style-rewrite` — takes `selected_text` + `style_reference` + `checked_elements` → returns rewritten text
- Use Claude Sonnet for the analysis (needs literary judgment), Gemini Flash or Sonnet for the rewrite

### Which style reference for Cmd+L?
The spec says "rewrite in the style of one of the style references." We need a way to pick which one. Options:
- Auto-pick the first non-empty one
- Show a selector in the chat before starting
- Let user pick from a dropdown

I'll go with: show a dropdown/selector of the non-empty style references when Cmd+L is pressed, before starting the analysis.
