from contextlib import asynccontextmanager

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import health, nodes, document, ai, state, chat
from app.services import storage


@asynccontextmanager
async def lifespan(app: FastAPI):
    storage.load_state_snapshot()
    yield


app = FastAPI(title="Writing Canvas", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(nodes.router)
app.include_router(document.router)
app.include_router(ai.router)
app.include_router(state.router)
app.include_router(chat.router)
