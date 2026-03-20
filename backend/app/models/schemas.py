from enum import Enum
from typing import Any
from pydantic import BaseModel, Field
import uuid


class NodeType(str, Enum):
    vibe = "vibe"
    sketch = "sketch"
    excerpt = "excerpt"


# Abstraction level: vibe=1 (most abstract), sketch=2, excerpt=3
NODE_TYPE_LEVEL = {
    NodeType.vibe: 1,
    NodeType.sketch: 2,
    NodeType.excerpt: 3,
}


class CanvasNode(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: NodeType
    content: str = ""
    x: float = 0
    y: float = 0
    w: float = 200
    h: float = 120
    level: int = 1  # derived from type, but stored for convenience

    def model_post_init(self, __context: Any) -> None:
        self.level = NODE_TYPE_LEVEL[self.type]


class CanvasNodeCreate(BaseModel):
    type: NodeType
    content: str = ""
    x: float = 0
    y: float = 0
    w: float = 200
    h: float = 120


class CanvasNodeUpdate(BaseModel):
    content: str | None = None
    x: float | None = None
    y: float | None = None
    w: float | None = None
    h: float | None = None


class Document(BaseModel):
    content: Any = {"type": "doc", "content": [{"type": "paragraph"}]}


class ProjectData(BaseModel):
    nodes: dict[str, CanvasNode] = {}
    document: Document = Document()
    style_references: list[str] = Field(default_factory=lambda: ["", "", "", ""])
