import os
from google import genai
from anthropic import Anthropic

gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY", ""))
anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))


async def suggest_from_node(node_type: str, node_content: str, all_nodes: list[dict]) -> str:
    """Use Gemini Flash to suggest a new node at the next abstraction level."""
    level_names = {"vibe": "sketch", "sketch": "excerpt"}
    target = level_names.get(node_type, "excerpt")

    context_str = "\n".join(
        f"- [{n['type']}] {n['content']}" for n in all_nodes if n['content']
    )

    prompt = f"""You are a creative writing assistant helping develop ideas for a short-form prose/poetry piece.

The author has the following elements on their canvas:
{context_str}

They want to develop the following {node_type} into a {target}:
"{node_content}"

{"A 'sketch' is a concrete note about characters, locations, events, or plot devices that embodies the vibe." if target == "sketch" else "A 'excerpt' is a short piece of actual prose, a paragraph or two, that could appear in the final piece — or a stylistic reference."}

Write a concise {target} (2-4 sentences) that naturally develops from the given {node_type}. Return ONLY the {target} text, no labels or explanation."""

    response = gemini_client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
    )
    return response.text.strip()


async def rewrite_passage(
    excerpt_content: str,
    document_selection: str,
    full_document: str,
) -> str:
    """Use Claude Opus to rewrite a document passage based on a excerpt/reference."""
    message = anthropic_client.messages.create(
        model="claude-opus-4-0-20250514",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": f"""You are a skilled creative writing editor.

The author is working on a piece of writing. Here is the full document so far:
---
{full_document}
---

They have selected this passage to rewrite:
"{document_selection}"

They want it rewritten to incorporate the style, theme, or content of this reference:
"{excerpt_content}"

Rewrite ONLY the selected passage, maintaining the same approximate length and fitting naturally into the surrounding text. Return only the rewritten passage, no explanation.""",
            }
        ],
    )
    return message.content[0].text.strip()
