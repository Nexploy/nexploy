import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '@/../prisma/prisma';
import { fail, guard, ok } from '../helpers';
import { ToolContext, ToolGroup } from '../types';
import { decrypt } from '@/lib/encryption';
import { getValidToken } from '@/services/api/gitProvider.service';
import { tokenGitStorage } from '@/lib/storage/token-git-storage';
import { savePipelineConfig } from '@/services/pipeline.service';
import { extractGitHubRepo, extractGitLabRepo } from '@/services/git/git.service';
import { kyGithubApi } from '@/lib/api/kyGithub';
import { kyGitlab } from '@/lib/api/kyGitlab';
import type { PipelineGraph } from '@workspace/typescript-interface/pipeline/node';
import { getCompactCatalog, PIPELINE_NODE_CATALOG } from '@/lib/ai/pipelineNodeCatalog';
import {
    analyzeRepositorySchema,
    savePipelineMcpSchema,
} from '@workspace/schemas-zod/pipeline/pipelineGraph.schema';

const KEY_FILES = [
    'Dockerfile',
    'docker-compose.yml',
    'docker-compose.yaml',
    'package.json',
    'requirements.txt',
    'go.mod',
    'pyproject.toml',
    'Cargo.toml',
    '.nvmrc',
    'Makefile',
    'pom.xml',
    'build.gradle',
    'composer.json',
    '.env.example',
];


type GitHubContentFile = {
    type: string;
    name: string;
    content?: string;
    encoding?: string;
};

type GitLabTreeEntry = { name: string; type: string };

type GitLabFileContent = { content: string; encoding: string };

async function fetchGithubFiles(
    owner: string,
    repoName: string,
    ref: string,
): Promise<{ rootFiles: { name: string; type: string }[]; files: Record<string, string> }> {
    const rootFiles: { name: string; type: string }[] = [];
    const files: Record<string, string> = {};

    try {
        const rootContent = await kyGithubApi
            .get(`repos/${owner}/${repoName}/contents/`, { searchParams: { ref } })
            .json<GitHubContentFile[]>();
        rootFiles.push(...rootContent.map((f) => ({ name: f.name, type: f.type })));
    } catch {}

    for (const fileName of KEY_FILES) {
        try {
            const fileData = await kyGithubApi
                .get(`repos/${owner}/${repoName}/contents/${fileName}`, { searchParams: { ref } })
                .json<GitHubContentFile>();

            if (fileData.type === 'file' && fileData.encoding === 'base64' && fileData.content) {
                files[fileName] = Buffer.from(fileData.content.replace(/\n/g, ''), 'base64')
                    .toString('utf-8')
                    .substring(0, 3000);
            }
        } catch {}
    }

    return { rootFiles, files };
}

async function fetchGitlabFiles(
    baseUrl: string,
    encodedPath: string,
    ref: string,
): Promise<{ rootFiles: { name: string; type: string }[]; files: Record<string, string> }> {
    const rootFiles: { name: string; type: string }[] = [];
    const files: Record<string, string> = {};

    try {
        const tree = await kyGitlab(baseUrl)
            .get(`v4/projects/${encodedPath}/repository/tree`, {
                searchParams: { ref, per_page: '100' },
            })
            .json<GitLabTreeEntry[]>();
        rootFiles.push(...tree.map((f) => ({ name: f.name, type: f.type })));
    } catch {}

    for (const fileName of KEY_FILES) {
        try {
            const fileData = await kyGitlab(baseUrl)
                .get(
                    `v4/projects/${encodedPath}/repository/files/${encodeURIComponent(fileName)}`,
                    { searchParams: { ref } },
                )
                .json<GitLabFileContent>();

            if (fileData.encoding === 'base64') {
                files[fileName] = Buffer.from(fileData.content.replace(/\n/g, ''), 'base64')
                    .toString('utf-8')
                    .substring(0, 3000);
            }
        } catch {}
    }

    return { rootFiles, files };
}

export const pipelineGroup: ToolGroup = {
    name: 'pipeline',

    register(server: McpServer, ctx: ToolContext) {
        if (ctx.allowPipelineGroup === false) return;

        server.registerTool(
            'listPipelineNodes',
            {
                description:
                    'Returns the full catalog of available pipeline node types with their category, description, config fields, and input/output data. Call this before designing a pipeline to know which nodes are available and what each one does.',
            },
            async () => {
                const g = guard(ctx, 'repository', 'read');
                if (g) return g;
                return ok(getCompactCatalog());
            },
        );

        server.registerTool(
            'getPipelineNodeDetail',
            {
                description:
                    'Returns the full detail (all config fields with types, defaults, and descriptions) for one specific pipeline node type.',
                inputSchema: {
                    nodeType: z
                        .string()
                        .min(1)
                        .describe('The node type to get detail for (e.g. "build-docker-image")'),
                },
            },
            async ({ nodeType }) => {
                const g = guard(ctx, 'repository', 'read');
                if (g) return g;
                const entry = PIPELINE_NODE_CATALOG.find((n) => n.type === nodeType);
                if (!entry)
                    return fail(
                        `Unknown node type "${nodeType}". Call listPipelineNodes to see available types.`,
                    );
                return ok(JSON.stringify(entry, null, 2));
            },
        );

        server.registerTool(
            'analyzeRepository',
            {
                description:
                    "Fetch and analyze a repository's file structure and key configuration files (Dockerfile, package.json, docker-compose.yml, go.mod, etc.) to understand its tech stack. Call this first before generating a pipeline.",
                inputSchema: analyzeRepositorySchema.shape,
            },
            async ({ repositoryId, branch }) => {
                const g = guard(ctx, 'repository', 'read');
                if (g) return g;
                try {
                    const repo = await prisma.repository.findUnique({
                        where: { id: repositoryId },
                        include: { gitAccount: true },
                    });

                    if (!repo) return fail(`Repository "${repositoryId}" not found`);
                    if (!repo.gitAccount)
                        return fail('Repository has no linked git account — cannot read files');

                    const gitAccount = repo.gitAccount;

                    const rawToken = {
                        accessToken: decrypt(gitAccount.accessToken),
                        refreshToken: gitAccount.refreshToken
                            ? decrypt(gitAccount.refreshToken)
                            : null,
                        accessTokenExpiresAt: gitAccount.accessTokenExpiresAt,
                    };

                    const token = await getValidToken(
                        rawToken,
                        repo.gitProvider,
                        ctx.userId,
                        gitAccount.id,
                    );

                    const ref = branch ?? 'HEAD';

                    let rootFiles: { name: string; type: string }[] = [];
                    let files: Record<string, string> = {};

                    if (repo.gitProvider === 'GITHUB') {
                        const { owner, repo: repoName } = extractGitHubRepo(repo.repositoryUrl);
                        ({ rootFiles, files } = await tokenGitStorage.run(token, () =>
                            fetchGithubFiles(owner, repoName, ref),
                        ));
                    } else if (repo.gitProvider === 'GITLAB') {
                        const { baseUrl } = extractGitLabRepo(repo.repositoryUrl);
                        const url = new URL(repo.repositoryUrl);
                        const pathWithNamespace = url.pathname
                            .replace(/^\//, '')
                            .replace(/\.git$/, '');
                        const encodedPath = encodeURIComponent(pathWithNamespace);

                        ({ rootFiles, files } = await tokenGitStorage.run(token, () =>
                            fetchGitlabFiles(baseUrl, encodedPath, ref),
                        ));
                    } else {
                        return fail(`Unsupported git provider: ${repo.gitProvider}`);
                    }

                    const analysis = {
                        repositoryId: repo.id,
                        name: repo.name,
                        url: repo.repositoryUrl,
                        provider: repo.gitProvider,
                        ref,
                        rootFiles,
                        detectedFiles: Object.keys(files),
                        fileContents: files,
                    };

                    return ok(JSON.stringify(analysis, null, 2));
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'savePipeline',
            {
                description:
                    'Save a complete pipeline graph (nodes + edges) for a repository, replacing any existing pipeline. Call this after analyzing the repository and designing the appropriate pipeline workflow.',
                inputSchema: savePipelineMcpSchema.shape,
            },
            async ({ repositoryId, nodes, edges }) => {
                const g = guard(ctx, 'repository', 'update');
                if (g) return g;
                try {
                    const repo = await prisma.repository.findUnique({
                        where: { id: repositoryId },
                        select: { id: true, name: true },
                    });

                    if (!repo) return fail(`Repository "${repositoryId}" not found`);

                    await savePipelineConfig({
                        repositoryId,
                        graph: {
                            nodes: nodes as PipelineGraph['nodes'],
                            edges: edges as PipelineGraph['edges'],
                        },
                    });

                    return ok(
                        `Pipeline saved for repository "${repo.name}" — ${nodes.length} node(s), ${edges.length} edge(s). The pipeline is now ready to run.`,
                    );
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );
    },
};
