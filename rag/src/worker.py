from dotenv import load_dotenv
load_dotenv()


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
