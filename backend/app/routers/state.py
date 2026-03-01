from fastapi import APIRouter

from app.services import storage

router = APIRouter(prefix="/state", tags=["state"])


@router.post("/save")
async def save_state():
    storage.save_state_snapshot()
    return {"status": "ok"}
