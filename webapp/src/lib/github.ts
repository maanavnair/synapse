import { db } from "@/server/db";
import { Octokit } from "octokit";
import axios from 'axios';
import { aiSummariseCommit } from "./gemini";

export const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
})

type Response = {
    commitHash: string;
    commitMessage: string;
    commitAuthorName: string;
    commitAuthorAvatar: string;
    commitDate: string;
};

export const getCommitHashes = async (githubUrl: string): Promise<Response[]> => {
    const [owner, repo] = githubUrl.split("/").slice(-2);
    if (!owner || !repo) {
        throw new Error("Invalid github url");
    }
    const { data } = await octokit.rest.repos.listCommits({
        owner,
        repo,
    });

    const sortedCommits = data.sort(
        (a, b) =>
            new Date(b.commit.author?.date ?? 0).getTime() -
            new Date(a.commit.author?.date ?? 0).getTime()
    );

    return sortedCommits.slice(0, 10).map((commit) => ({
        commitHash: commit.sha as string,
        commitMessage: commit.commit.message ?? "",
        commitAuthorName: commit.commit.author?.name ?? "",
        commitAuthorAvatar: commit.author?.avatar_url ?? "",
        commitDate: commit.commit.author?.date ?? "",
    }));
};

export const pollCommit = async (projectId: string) => {
    const { project, githubUrl } = await fetchProjectGithubUrl(projectId);
    const commitHashes = await getCommitHashes(githubUrl);
    const unprocessedCommits = await filterUnprocessedCommits(projectId, commitHashes);
    const summaryResponses = await Promise.allSettled(unprocessedCommits.map(commit => {
        return summariseCommits(githubUrl, commit.commitHash)
    }))
    const summaries = summaryResponses.map((response) => {
        if (response.status === 'fulfilled') {
            return response.value as string
        }
        return ""
    })

    const commits = await db.commit.createMany({
        data: summaries.map((summary, index) => {
            console.log(`processing commit ${index}`)
            return {
                projectId: projectId,
                commitHash: unprocessedCommits[index]!.commitHash,
                commitMessage: unprocessedCommits[index]!.commitMessage,
                commitAuthorName: unprocessedCommits[index]!.commitAuthorName,
                commitAuthorAvatar: unprocessedCommits[index]!.commitAuthorAvatar,
                commitDate: unprocessedCommits[index]!.commitDate,
                summary
            }
        })
    })

    return commits;
}

async function summariseCommits(githubUrl: string, commitHash: string) {
    try {
        const response = await axios.get<string>(`${githubUrl}/commit/${commitHash}.diff`, {
            headers: {
                Accept: "application/vnd.github.v3+json",
            },
            responseType: "text",
        });
        const data = response.data;
        const summary = await aiSummariseCommit(data);
        // return summary ?? "No summary available";
        if (!summary || summary.trim().length < 10) {
            throw new Error("Empty Gemini summary");
        }
        return summary;
    } catch (err) {
        console.error("Failed to fetch commit diff:", err);
        return "No summary available";
    }
}

async function fetchProjectGithubUrl(projectId: string) {
    const project = await db.project.findUnique({
        where: {
            id: projectId,
        },
        select: {
            githubUrl: true
        }
    })
    if (!project?.githubUrl) throw new Error("Project has no github url");

    return { project, githubUrl: project?.githubUrl };
}

async function filterUnprocessedCommits(projectId: string, commitHashes: Response[]) {
    const processedCommits = await db.commit.findMany({
        where: {
            projectId,
            summary: {
                not: ""
            }
        }
    })

    const unprocessedCommits = commitHashes.filter((commit) => !processedCommits.some((processedCommit) =>
        processedCommit.commitHash === commit.commitHash
    ))

    return unprocessedCommits;
}