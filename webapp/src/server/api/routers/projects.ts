import z from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { pollCommit } from "@/lib/github";
import redisIngestRepo from "@/lib/redis";


export const projectRouter = createTRPCRouter({
    createProject: protectedProcedure.input(
        z.object({
            name: z.string(),
            githubUrl: z.string(),
            githubToken: z.string().optional()
        })
    ).mutation(async ({ ctx, input }) => {
        const repoName = /github\.com\/([^/]+\/[^/]+)/.exec(input.githubUrl)?.[1];
        if (!repoName) throw new Error("Invalid Github URL");
        const project = await ctx.db.project.create({
            data: {
                githubUrl: input.githubUrl,
                name: input.name,
                userToProjects: {
                    create: {
                        userId: ctx.user.userId!,
                    }
                }
            }
        })
        await pollCommit(project.id);
        await redisIngestRepo(repoName, input.githubToken || process.env.GITHUB_TOKEN!, project.id);
        return project;
    }),
    getProjects: protectedProcedure.query(async ({ ctx }) => {
        return await ctx.db.project.findMany({
            where: {
                userToProjects: {
                    some: {
                        userId: ctx.user.userId!
                    }
                },
                deletedAt: null
            }
        })
    }),
    getCommits: protectedProcedure.input(z.object({
        projectId: z.string()
    })).query(async ({ ctx, input }) => {
        pollCommit(input.projectId).then().catch(console.error)
        return await ctx.db.commit.findMany({ where: { projectId: input.projectId }, orderBy: { commitDate: 'desc' } })
    })
})