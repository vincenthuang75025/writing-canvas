from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel
from app.services import ai, storage

router = APIRouter(prefix="/ai", tags=["ai"])


class SuggestRequest(BaseModel):
    node_id: str


class SuggestResponse(BaseModel):
    content: str
    type: str  # the suggested node type


class RewriteRequest(BaseModel):
    snippet_content: str
    document_selection: str


class RewriteResponse(BaseModel):
    rewritten: str


@router.post("/suggest")
async def suggest(body: SuggestRequest) -> SuggestResponse:
    node = storage.get_node(body.node_id)
    if not node:
        raise ValueError("Node not found")

    all_nodes = [n.model_dump() for n in storage.get_all_nodes()]

    level_names = {"vibe": "sketch", "sketch": "snippet"}
    target_type = level_names.get(node.type.value, "snippet")

    content = await ai.suggest_from_node(node.type.value, node.content, all_nodes)
    return SuggestResponse(content=content, type=target_type)


@router.post("/rewrite")
async def rewrite(body: RewriteRequest) -> RewriteResponse:
    doc = storage.get_document()
    # Extract plain text from TipTap JSON for context
    full_text = _extract_text(doc.content)

    rewritten = await ai.rewrite_passage(
        body.snippet_content,
        body.document_selection,
        full_text,
    )
    return RewriteResponse(rewritten=rewritten)


def _extract_text(tiptap_json: Any) -> str:
    """Recursively extract plain text from TipTap JSON."""
    if isinstance(tiptap_json, str):
        return tiptap_json
    if isinstance(tiptap_json, dict):
        if tiptap_json.get("type") == "text":
            return tiptap_json.get("text", "")
        content = tiptap_json.get("content", [])
        parts = [_extract_text(c) for c in content]
        if tiptap_json.get("type") == "paragraph":
            return " ".join(parts) + "\n"
        return " ".join(parts)
    if isinstance(tiptap_json, list):
        return " ".join(_extract_text(item) for item in tiptap_json)
    return ""
