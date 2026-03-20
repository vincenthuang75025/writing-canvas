from pydantic import BaseModel
from fastapi import APIRouter

from app.services import storage

router = APIRouter()


class StyleReferencesPayload(BaseModel):
    references: list[str]


@router.get("/style-references")
def get_style_references():
    refs = storage.get_style_references()
    return {"references": refs}


@router.put("/style-references")
def update_style_references(payload: StyleReferencesPayload):
    refs = storage.update_style_references(payload.references)
    return {"references": refs}
