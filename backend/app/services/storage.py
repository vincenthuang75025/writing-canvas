import json
from pathlib import Path
from app.models.schemas import ProjectData, CanvasNode, Document

DATA_DIR = Path(__file__).parent.parent.parent / "data"
DATA_FILE = DATA_DIR / "project.json"

# STATE.json lives in the project root (parent of backend/)
STATE_FILE = Path(__file__).parent.parent.parent.parent / "STATE.json"


def _ensure_dir():
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def load_project() -> ProjectData:
    _ensure_dir()
    if DATA_FILE.exists():
        raw = json.loads(DATA_FILE.read_text())
        return ProjectData.model_validate(raw)
    return ProjectData()


def save_project(data: ProjectData):
    _ensure_dir()
    DATA_FILE.write_text(data.model_dump_json(indent=2))


# --- Node operations ---

def get_all_nodes() -> list[CanvasNode]:
    return list(load_project().nodes.values())


def get_node(node_id: str) -> CanvasNode | None:
    return load_project().nodes.get(node_id)


def create_node(node: CanvasNode) -> CanvasNode:
    project = load_project()
    project.nodes[node.id] = node
    save_project(project)
    return node


def update_node(node_id: str, updates: dict) -> CanvasNode | None:
    project = load_project()
    if node_id not in project.nodes:
        return None
    node = project.nodes[node_id]
    for key, value in updates.items():
        if value is not None:
            setattr(node, key, value)
    project.nodes[node_id] = node
    save_project(project)
    return node


def delete_node(node_id: str) -> bool:
    project = load_project()
    if node_id not in project.nodes:
        return False
    del project.nodes[node_id]
    save_project(project)
    return True


# --- Document operations ---

def get_document() -> Document:
    return load_project().document


def update_document(content: dict) -> Document:
    project = load_project()
    project.document = Document(content=content)
    save_project(project)
    return project.document


# --- Style references operations ---

def get_style_references() -> list[str]:
    return load_project().style_references


def update_style_references(refs: list[str]) -> list[str]:
    project = load_project()
    # Ensure exactly 4 entries, padding with empty strings if needed
    padded = (refs + ["", "", "", ""])[:4]
    project.style_references = padded
    save_project(project)
    return project.style_references


# --- State snapshot operations ---

def save_state_snapshot():
    """Save current project data to STATE.json in project root."""
    project = load_project()
    STATE_FILE.write_text(project.model_dump_json(indent=2))


def load_state_snapshot():
    """If STATE.json exists, load it into data/project.json."""
    if STATE_FILE.exists():
        raw = json.loads(STATE_FILE.read_text())
        project = ProjectData.model_validate(raw)
        save_project(project)
