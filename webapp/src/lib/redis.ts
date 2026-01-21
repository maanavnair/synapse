import { Redis } from "@upstash/redis";
import { v4 as uuidv4 } from "uuid";

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export default async function redisIngestRepo(repoName: string, accessToken: string, projectId: string) {
    const jobId = uuidv4();

    await redis.lpush(
        "repo-ingest-queue",
        JSON.stringify({
            jobId,
            repoName,
            accessToken,
            projectId,
            timestamp: new Date().toISOString(),
        })
    );

    console.log(`Enqueued job ${jobId} for ${repoName}`);
}