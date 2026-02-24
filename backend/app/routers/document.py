from typing import Any
from fastapi import APIRouter
from app.models.schemas import Document
from app.services import storage

router = APIRouter(prefix="/document", tags=["document"])


@router.get("")
async def get_document() -> Document:
    return storage.get_document()


@router.put("")
async def update_document(body: dict[str, Any]) -> Document:
    return storage.update_document(body.get("content", {}))
