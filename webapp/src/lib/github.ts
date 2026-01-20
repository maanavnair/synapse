import { Octokit } from "octokit";

export const oktokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
})