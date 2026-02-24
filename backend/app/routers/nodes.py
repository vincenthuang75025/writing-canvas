from fastapi import APIRouter, HTTPException
from app.models.schemas import CanvasNode, CanvasNodeCreate, CanvasNodeUpdate
from app.services import storage

router = APIRouter(prefix="/nodes", tags=["nodes"])


@router.get("")
async def list_nodes() -> list[CanvasNode]:
    return storage.get_all_nodes()


@router.get("/{node_id}")
async def get_node(node_id: str) -> CanvasNode:
    node = storage.get_node(node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    return node


@router.post("", status_code=201)
async def create_node(body: CanvasNodeCreate) -> CanvasNode:
    node = CanvasNode(**body.model_dump())
    return storage.create_node(node)


@router.put("/{node_id}")
async def update_node(node_id: str, body: CanvasNodeUpdate) -> CanvasNode:
    node = storage.update_node(node_id, body.model_dump(exclude_unset=True))
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    return node


@router.delete("/{node_id}", status_code=204)
async def delete_node(node_id: str):
    if not storage.delete_node(node_id):
        raise HTTPException(status_code=404, detail="Node not found")
