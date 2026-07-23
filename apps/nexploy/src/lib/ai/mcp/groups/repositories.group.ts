import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
    cancelBuildSchema,
    getBuildLogsSchema,
    listBuildsSchema,
    mcpTriggerBuildSchema,
    removeBuildSchema,
    setMcpEnvVariablesSchema,
} from '@workspace/schemas-zod/inngest/build.schema';
import { deleteRepositorySchema } from '@workspace/schemas-zod/repository/settings/deleteRepository.schema';
import {
    deleteRepository,
    getBuildNodeLogs,
    getBuilds,
    getRepositorieById,
    getRepositories,
    getRepositorieWithEnv,
    updateEnvVariables,
} from '@/services/repository.service';
import {
    cancelBuildRepository,
    removeBuild,
    startBuildRepository,
} from '@/services/repository/build.service';
import { fail, guard, guardDestructive, ok } from '../helpers';
import { ToolContext, ToolGroup } from '../types';
import { resolveOrganizationIdForBuild } from '@/lib/auth/resolveOrgContext';

export const repositoriesGroup: ToolGroup = {
    name: 'repositories',

    register(server: McpServer, ctx: ToolContext) {
        if (ctx.allowRepositoriesGroup === false) return;

        server.registerTool(
            'listRepositories',
            {
                description:
                    'List all Nexploy repositories with their latest build/deployment status.',
            },
            async () => {
                const g = guard(ctx, 'repository', 'read');
                if (g) return g;
                try {
                    const repos = await getRepositories();
                    const data = repos.map((repo) => ({
                        id: repo.id,
                        name: repo.name,
                        url: repo.repositoryUrl,
                        lastBuild: repo.build?.[0]
                            ? {
                                  id: repo.build[0].id,
                                  status: repo.build[0].status,
                                  createdAt: repo.build[0].createdAt,
                              }
                            : null,
                    }));
                    return ok(JSON.stringify({ count: repos.length, data }));
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'getRepository',
            {
                description: 'Get full details of a repository.',
                inputSchema: listBuildsSchema.shape,
            },
            async ({ repositoryId }) => {
                const g = guard(ctx, 'repository', 'read');
                if (g) return g;
                try {
                    const repo = await getRepositorieById(repositoryId);
                    if (!repo) return fail(`Repository "${repositoryId}" not found`);
                    return ok(JSON.stringify(repo));
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'listBuilds',
            {
                description: 'List all builds for a repository (most recent first).',
                inputSchema: listBuildsSchema.shape,
            },
            async ({ repositoryId }) => {
                const g = guard(ctx, 'build', 'read');
                if (g) return g;
                try {
                    const builds = await getBuilds(repositoryId);
                    const data = builds.map((b) => ({
                        id: b.id,
                        status: b.status,
                        branch: b.branch,
                        commitHash: b.commitHash,
                        createdAt: b.createdAt,
                        updatedAt: b.updatedAt,
                    }));
                    return ok(JSON.stringify({ count: data.length, data }));
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'getBuildNodeLogs',
            {
                description: 'Get logs for a specific pipeline node within a build.',
                inputSchema: getBuildLogsSchema.shape,
            },
            async ({ repositoryId, buildId, nodeId }) => {
                const g = guard(ctx, 'build', 'read');
                if (g) return g;
                try {
                    const logs = await getBuildNodeLogs(repositoryId, buildId, nodeId);
                    const text = (logs ?? []).map((l) => `[${l.level}] ${l.message}`).join('\n');
                    return ok(text || 'No logs found');
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'triggerRepositoryBuild',
            {
                description: 'Start a new build and deployment for a repository.',
                inputSchema: mcpTriggerBuildSchema.shape,
            },
            async ({ repositoryId, branch }) => {
                const g = guard(ctx, 'repository', 'deploy');
                if (g) return g;
                try {
                    const build = await startBuildRepository({ repositoryId, branch }, ctx.userId);
                    return ok(`Build started (ID: ${build.id})`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'setEnvVariables',
            {
                description: 'Create or update environment variables for a repository.',
                inputSchema: setMcpEnvVariablesSchema.shape,
            },
            async ({ repositoryId, vars }) => {
                const g = guard(ctx, 'repository', 'update');
                if (g) return g;
                try {
                    const repo = await getRepositorieWithEnv(repositoryId);
                    if (!repo) return fail(`Repository "${repositoryId}" not found`);

                    const existing = repo.envVariables ?? [];
                    const updates: { id: string; key: string; value: string }[] = [];
                    const creates: { key: string; value: string }[] = [];

                    for (const v of vars) {
                        const found = existing.find((e: any) => e.key === v.key);
                        if (found) {
                            updates.push({ id: found.id, key: v.key, value: v.value });
                        } else {
                            creates.push({ key: v.key, value: v.value });
                        }
                    }

                    await updateEnvVariables(repositoryId, ctx.userId, {
                        updates,
                        creates,
                        deleteIds: [],
                    });
                    return ok(
                        `Set ${vars.length} variable(s) (${creates.length} created, ${updates.length} updated)`,
                    );
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'cancelBuild',
            {
                description: 'Cancel a running build.',
                inputSchema: cancelBuildSchema.shape,
            },
            async ({ buildId }) => {
                const g = guard(ctx, 'build', 'cancel');
                if (g) return g;
                try {
                    await cancelBuildRepository(buildId);
                    return ok(`Build ${buildId} cancelled`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'removeBuild',
            {
                description: 'Remove a build record from history.',
                inputSchema: removeBuildSchema.shape,
            },
            async ({ buildId }) => {
                const g = guard(ctx, 'build', 'delete');
                if (g) return g;
                try {
                    const organizationId = await resolveOrganizationIdForBuild(buildId);
                    if (!organizationId) return fail('Build not found');
                    await removeBuild(buildId, organizationId);
                    return ok(`Build ${buildId} removed`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'deleteRepository',
            {
                description:
                    'Delete a repository. confirmName must exactly match the repository name.',
                inputSchema: deleteRepositorySchema.shape,
            },
            async (params) => {
                const g = guardDestructive(ctx, 'repository', 'delete', params.confirmName);
                if (g) return g;
                try {
                    await deleteRepository(params, ctx.userId);
                    return ok(`Repository deleted`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );
    },
};
