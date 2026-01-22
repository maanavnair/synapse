from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from contextlib import asynccontextmanager
import asyncio
import json
from upstash_redis import Redis


from upstash_redis import Redis
import asyncio
import json

redis = Redis.from_env()
QUEUE_NAME = "repo-ingest-queue"

async def worker():
    print("Background worker started...")
    while True:
        try:
            job_data = redis.rpop(QUEUE_NAME)

            if job_data is None:
                await asyncio.sleep(2)
                continue

            job = json.loads(job_data)

            jobId = job.get("jobId")
            repoUrl = job.get("repoName")
            accessToken = job.get("accessToken")
            projectId = job.get("projectId")

            print(
                f"Processing job {jobId} for {projectId} where Repo URL is {repoUrl}"
            )

            # await asyncio.to_thread(loadDocAndStore, repoUrl, accessToken, projectId)

        except Exception as e:
            print(f"Error processing job: {e}")
            await asyncio.sleep(2)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    print("🚀 App starting up...")
    task = asyncio.create_task(worker())

    yield  # the app runs here while the worker runs in the background

    # Shutdown logic
    print("🛑 Shutting down...")
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        print("✅ Worker stopped.")


app = FastAPI(lifespan=lifespan)


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok"}