import os
import json
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


async def inline_rewrite(selected_text: str, paragraph_context: str, note: str) -> list[str]:
    """Use Gemini Flash to suggest alternative words/phrases for a highlighted selection."""
    prompt = f"""You are a creative writing assistant. The author is working on the following paragraph:

"{paragraph_context}"

They have highlighted the word/phrase "{selected_text}" and are dissatisfied with it. Their note: "{note}"

Suggest 2-3 alternative words or phrases that could replace "{selected_text}" in the context of this paragraph. Each alternative should fit naturally into the surrounding text, with a brief explanation of what the alternative tries to achieve.

Return your answer as a JSON array of strings, e.g. ["alternative 1 (explanation)", "alternative 2 (explanation)", ...].
Return ONLY the JSON array, nothing else."""

    response = anthropic_client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
    )
    raw = response.content[0].text.strip()
    try:
        alternatives = json.loads(raw)
        if isinstance(alternatives, list):
            return [str(a) for a in alternatives]
    except json.JSONDecodeError:
        pass
    return [line.strip().lstrip("- ") for line in raw.split("\n") if line.strip()]


async def style_analyze(selected_text: str, style_reference: str) -> list[str]:
    """Use Claude Sonnet to analyze stylistic elements of a reference passage."""
    message = anthropic_client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": f"""Consider the following piece of text, which is meant to be edited:

<begin_text>
{selected_text}
<end_text>

We are trying to keep the subject matter and change the style to match the following:
<begin_style>
{style_reference}
<end_style>

Reflect on the stylistic markers of the style reference - diction, rhythm, form, and so on, including where it differs from the existing text.

Return your answer as a JSON array of strings, each a couple sentences describing one stylistic element, eg. ["Style element 1", "Style element 2"].

Return ONLY the JSON array, nothing else.""",
            }
        ],
    )
    raw = message.content[0].text.strip()
    # Parse the JSON array from the response
    try:
        elements = json.loads(raw)
        if isinstance(elements, list):
            return [str(e) for e in elements]
    except json.JSONDecodeError:
        pass
    # Fallback: split by newlines if JSON parsing fails
    return [line.strip().lstrip("- ") for line in raw.split("\n") if line.strip()]


async def style_rewrite(
    selected_text: str, style_reference: str, elements: list[str]
) -> str:
    """Use Claude Sonnet to rewrite text applying specific stylistic elements."""
    elements_str = "\n".join(f"- {e}" for e in elements)
    message = anthropic_client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": f"""Consider the following piece of text, which is meant to be edited:

<begin_text>
{selected_text}
<end_text>

We are trying to keep the subject matter and change the style to match the following:
<begin_style>
{style_reference}
<end_style>

The author has reflected on the key stylistic elements they like from the reference, and decided to focus on the following:
{elements_str}

Rewrite the existing text to match the stylistic reference elements while keeping the subject matter unchanged. Return ONLY the rewritten passage, no explanation.""",
            }
        ],
    )
    return message.content[0].text.strip()
