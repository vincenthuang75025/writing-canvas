import json
from pydantic import BaseModel
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.services.ai import anthropic_client
from app.services import storage

router = APIRouter()


def _extract_text_from_tiptap(doc: dict) -> str:
    """Recursively extract plain text from a TipTap/ProseMirror JSON document."""
    parts = []
    for node in doc.get("content", []):
        if node.get("type") in ("paragraph", "heading", "blockquote"):
            line_parts = []
            for child in node.get("content", []):
                if child.get("type") == "text":
                    line_parts.append(child.get("text", ""))
            if line_parts:
                parts.append("".join(line_parts))
        elif node.get("type") in ("bulletList", "orderedList"):
            for item in node.get("content", []):
                item_text = _extract_text_from_tiptap(item)
                if item_text:
                    parts.append(f"- {item_text}")
        elif node.get("content"):
            parts.append(_extract_text_from_tiptap(node))
    return "\n".join(parts)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


@router.post("/chat")
def chat(req: ChatRequest):
    # Build system prompt with all canvas nodes + document as context
    nodes = storage.get_all_nodes()
    document = storage.get_document()

    # Group nodes by type for clearer presentation
    vibes = [n for n in nodes if n.type == "vibe" and n.content]
    sketches = [n for n in nodes if n.type == "sketch" and n.content]
    excerpts = [n for n in nodes if n.type == "excerpt" and n.content]

    system = """You are a creative writing assistant embedded in a writing canvas tool. The author is developing a short-form prose or poetry piece and needs help brainstorming.

The canvas is organized by level of abstraction, from most abstract to most concrete:

- **Vibes**: High-level sentiments, themes, and moods the author wants the piece to evoke.
- **Sketches**: Concrete notes about characters, locations, events, plot devices, or structure.
- **Excerpts**: Actual passages of prose the author has drafted, or quotations from other works serving as stylistic or thematic references.

The author also has a document editor where they compose the final piece itself.

Here is the current state of the author's canvas and document:
"""

    if vibes:
        system += "\nVIBES:\n" + "\n".join(f"- {n.content}" for n in vibes)
    if sketches:
        system += "\nSKETCHES:\n" + "\n".join(f"- {n.content}" for n in sketches)
    if excerpts:
        system += "\nEXCERPTS:\n" + "\n".join(f"- {n.content}" for n in excerpts)
    if not (vibes or sketches or excerpts):
        system += "\n(No canvas nodes yet.)"

    # Include document text if available
    doc_content = document.content
    if isinstance(doc_content, dict) and doc_content.get("content"):
        # Extract plain text from TipTap JSON
        doc_text = _extract_text_from_tiptap(doc_content)
        if doc_text.strip():
            system += f"\n\nDOCUMENT (work in progress):\n{doc_text}"

    system += """

Help the author develop their piece. You can help with brainstorming themes, developing characters or plot, suggesting prose, giving feedback on drafts, or anything else related to their creative process. Be concise and conversational. When referencing their existing material, be specific about which nodes or passages you mean."""

    messages = [{"role": m.role, "content": m.content} for m in req.messages]

    def generate():
        with anthropic_client.messages.stream(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=system,
            messages=messages,
        ) as stream:
            for text in stream.text_stream:
                yield f"data: {json.dumps({'type': 'content_delta', 'text': text})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
