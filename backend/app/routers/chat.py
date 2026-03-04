import json
from pydantic import BaseModel
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.services.ai import anthropic_client
from app.services import storage

router = APIRouter()


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


@router.post("/chat")
def chat(req: ChatRequest):
    # Build system prompt with all canvas nodes as context
    nodes = storage.get_all_nodes()
    node_lines = []
    for n in nodes:
        if n.content:
            node_lines.append(f"- [{n.type}] {n.content}")

    system = "You are a helpful creative writing assistant. The author has the following elements on their writing canvas:\n"
    if node_lines:
        system += "\n".join(node_lines)
    else:
        system += "(no nodes yet)"
    system += "\n\nUse these as context when helping the author. Be concise and helpful."

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
