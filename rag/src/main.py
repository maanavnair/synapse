from fastapi import FastAPI
from contextlib import asynccontextmanager
import asyncio
from worker import worker

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("App starting up...")
    task = asyncio.create_task(worker())
    yield
    print("Shutting down...")
    task.cancel()

app = FastAPI(
    title="Rag Service",
    lifespan=lifespan
)

@app.get("/")
def health_check():
    return {
        "status": "ok",
        "message": "FastAPI server is running"
    }
