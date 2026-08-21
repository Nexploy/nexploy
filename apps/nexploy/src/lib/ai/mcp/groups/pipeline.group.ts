import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '@/../prisma/prisma';
import { fail, guard, guardRepository, ok } from '../helpers';
import { ToolContext, ToolGroup } from '../types';
import { decrypt } from '@/lib/encryption';
import { getValidToken } from '@/services/git/core/token.service';
import { tokenGitStorage } from '@/lib/storage/token-git-storage';
import { savePipelineConfig } from '@/services/pipeline.service';
import { getFirstStage } from '@/services/repository/deploymentStage.service';
import { kyGithubApi } from '@/services/git/providers/github/github.client';
import { kyGitlab } from '@/services/git/providers/gitlab/gitlab.client';
import { kyGitea } from '@/services/git/providers/gitea/gitea.client';
import { kyBitbucket } from '@/services/git/providers/bitbucket/bitbucket.client';
import {
    azureGetFileContent,
    azureGetRepository,
    azureGetRootItems,
    azureGetTree,
} from '@/services/git/providers/azureRepos/azureRepos.client';
import { getGitAdapter } from '@/services/git/core/registry';
import type { PipelineGraph } from '@nexploy/nodes/core/node';
import { getCompactCatalog, PIPELINE_NODE_CATALOG } from '@/lib/ai/pipelineNodeCatalog';
import { getNodeDescriptor } from '@nexploy/nodes/registry/descriptors';
import { analyzeRepositorySchema, savePipelineMcpSchema } from '@workspace/schemas-zod/pipeline/pipelineGraph.schema';

type GitHubContentFile = {
    type: string;
    name: string;
    content?: string;
    encoding?: string;
};

type GitTreeResponse = { tree?: { path: string; type: string }[] };

type GitLabTreeEntry = { name: string; type: string; path: string };

type GiteaContentFile = {
    type: string;
    name: string;
    content?: string;
    encoding?: string;
};

type GitLabFileContent = { content: string; encoding: string };

type BitbucketDirEntry = { path: string; type: string };

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

const KEY_FILE_SET = new Set(KEY_FILES);

const IGNORED_PATH_SEGMENTS = new Set([
    'node_modules',
    'vendor',
    'dist',
    'build',
    'out',
    'target',
    'coverage',
    '__pycache__',
    'test',
    'tests',
    'fixtures',
    'example',
    'examples',
]);

const MAX_PATH_DEPTH = 3;
const MAX_KEY_FILES = 20;
const MAX_FILE_CHARS = 3000;

type RepoEntry = { name: string; type: string };

type RepoReader = {
    listTree(): Promise<string[]>;
    listRoot(): Promise<RepoEntry[]>;
    readFile(path: string): Promise<string>;
};

function selectKeyPaths(paths: string[]): string[] {
    const candidates = paths.filter((path) => {
        const segments = path.split('/');
        if (segments.length > MAX_PATH_DEPTH) return false;
        if (!KEY_FILE_SET.has(segments[segments.length - 1]!)) return false;
        return !segments.slice(0, -1).some((segment) => IGNORED_PATH_SEGMENTS.has(segment));
    });

    candidates.sort((a, b) => a.split('/').length - b.split('/').length || a.localeCompare(b));
    return candidates.slice(0, MAX_KEY_FILES);
}

function rootEntriesFromTree(paths: string[]): RepoEntry[] {
    const entries = new Map<string, string>();
    for (const path of paths) {
        const segments = path.split('/');
        const name = segments[0]!;
        if (segments.length > 1) entries.set(name, 'dir');
        else if (!entries.has(name)) entries.set(name, 'file');
    }
    return [...entries].map(([name, type]) => ({ name, type }));
}

async function readRepository(reader: RepoReader): Promise<{
    rootFiles: RepoEntry[];
    files: Record<string, string>;
    recursive: boolean;
}> {
    let tree: string[] = [];
    try {
        tree = await reader.listTree();
    } catch {}

    let rootFiles: RepoEntry[];
    let paths: string[];

    if (tree.length > 0) {
        rootFiles = rootEntriesFromTree(tree);
        paths = selectKeyPaths(tree);
    } else {
        rootFiles = await reader.listRoot().catch(() => []);
        paths = [...KEY_FILES];
    }

    const files: Record<string, string> = {};
    for (const path of paths) {
        try {
            const content = await reader.readFile(path);
            if (content) files[path] = content.substring(0, MAX_FILE_CHARS);
        } catch {}
    }

    return { rootFiles, files, recursive: tree.length > 0 };
}

function decodeBase64(content: string): string {
    return Buffer.from(content.replace(/\n/g, ''), 'base64').toString('utf-8');
}

function githubReader(owner: string, repoName: string, ref: string): RepoReader {
    return {
        async listTree() {
            const tree = await kyGithubApi
                .get(`repos/${owner}/${repoName}/git/trees/${ref}`, { searchParams: { recursive: '1' } })
                .json<GitTreeResponse>();
            return (tree.tree ?? []).filter((entry) => entry.type === 'blob').map((entry) => entry.path);
        },
        async listRoot() {
            const rootContent = await kyGithubApi
                .get(`repos/${owner}/${repoName}/contents/`, { searchParams: { ref } })
                .json<GitHubContentFile[]>();
            return rootContent.map((file) => ({ name: file.name, type: file.type }));
        },
        async readFile(path) {
            const fileData = await kyGithubApi
                .get(`repos/${owner}/${repoName}/contents/${path}`, { searchParams: { ref } })
                .json<GitHubContentFile>();
            if (fileData.type !== 'file' || fileData.encoding !== 'base64' || !fileData.content) return '';
            return decodeBase64(fileData.content);
        },
    };
}

function gitlabReader(baseUrl: string, encodedPath: string, ref: string): RepoReader {
    return {
        async listTree() {
            const tree = await kyGitlab(baseUrl)
                .get(`v4/projects/${encodedPath}/repository/tree`, {
                    searchParams: { ref, recursive: 'true', per_page: '100' },
                })
                .json<GitLabTreeEntry[]>();
            return tree.filter((entry) => entry.type === 'blob').map((entry) => entry.path);
        },
        async listRoot() {
            const tree = await kyGitlab(baseUrl)
                .get(`v4/projects/${encodedPath}/repository/tree`, { searchParams: { ref, per_page: '100' } })
                .json<GitLabTreeEntry[]>();
            return tree.map((entry) => ({ name: entry.name, type: entry.type }));
        },
        async readFile(path) {
            const fileData = await kyGitlab(baseUrl)
                .get(`v4/projects/${encodedPath}/repository/files/${encodeURIComponent(path)}`, {
                    searchParams: { ref },
                })
                .json<GitLabFileContent>();
            return fileData.encoding === 'base64' ? decodeBase64(fileData.content) : fileData.content;
        },
    };
}

function giteaReader(baseUrl: string, owner: string, repoName: string, ref: string): RepoReader {
    return {
        async listTree() {
            const tree = await kyGitea(baseUrl)
                .get(`repos/${owner}/${repoName}/git/trees/${ref}`, {
                    searchParams: { recursive: 'true', per_page: '1000' },
                })
                .json<GitTreeResponse>();
            return (tree.tree ?? []).filter((entry) => entry.type === 'blob').map((entry) => entry.path);
        },
        async listRoot() {
            const rootContent = await kyGitea(baseUrl)
                .get(`repos/${owner}/${repoName}/contents`, { searchParams: { ref } })
                .json<GiteaContentFile[]>();
            return rootContent.map((file) => ({ name: file.name, type: file.type }));
        },
        async readFile(path) {
            const fileData = await kyGitea(baseUrl)
                .get(`repos/${owner}/${repoName}/contents/${encodeURIComponent(path)}`, { searchParams: { ref } })
                .json<GiteaContentFile>();
            if (fileData.type !== 'file' || fileData.encoding !== 'base64' || !fileData.content) return '';
            return decodeBase64(fileData.content);
        },
    };
}

function bitbucketReader(workspace: string, repoSlug: string, ref: string): RepoReader {
    const listing = (searchParams: Record<string, string>) =>
        kyBitbucket()
            .get(`repositories/${workspace}/${repoSlug}/src/${ref}/`, { searchParams })
            .json<{ values: BitbucketDirEntry[] }>();

    return {
        async listTree() {
            const result = await listing({ max_depth: String(MAX_PATH_DEPTH), pagelen: '100' });
            return result.values.filter((entry) => entry.type === 'commit_file').map((entry) => entry.path);
        },
        async listRoot() {
            const result = await listing({ pagelen: '100' });
            return result.values.map((entry) => ({
                name: entry.path.split('/').pop() ?? entry.path,
                type: entry.type === 'commit_directory' ? 'dir' : 'file',
            }));
        },
        async readFile(path) {
            return kyBitbucket().get(`repositories/${workspace}/${repoSlug}/src/${ref}/${path}`).text();
        },
    };
}

function azureReposReader(organization: string, project: string, repository: string, branch: string): RepoReader {
    return {
        async listTree() {
            const items = await azureGetTree(organization, project, repository, branch);
            return items
                .filter((entry) => !entry.isFolder && entry.path !== '/')
                .map((entry) => entry.path.replace(/^\//, ''));
        },
        async listRoot() {
            const items = await azureGetRootItems(organization, project, repository, branch);
            return items
                .filter((entry) => entry.path !== '/')
                .map((entry) => ({ name: entry.path.replace(/^\//, ''), type: entry.isFolder ? 'dir' : 'file' }));
        },
        async readFile(path) {
            return azureGetFileContent(organization, project, repository, `/${path}`, branch);
        },
    };
}

function validateGraph(nodes: PipelineGraph['nodes'], edges: PipelineGraph['edges']): string[] {
    const errors: string[] = [];
    const nodeIds = new Set<string>();

    for (const node of nodes) {
        if (nodeIds.has(node.id)) errors.push(`${node.id}: duplicate node id`);
        nodeIds.add(node.id);

        if (node.type !== node.data.type) {
            errors.push(`${node.id}: type "${node.type}" does not match data.type "${node.data.type}"`);
        }

        const descriptor = getNodeDescriptor(node.data.type);
        if (!descriptor) {
            errors.push(`${node.id}: unknown node type "${node.data.type}"`);
            continue;
        }

        if (!descriptor.configSchema) continue;

        const parsed = descriptor.configSchema.safeParse(node.data.config ?? {});
        if (!parsed.success) {
            const issues = parsed.error.issues
                .map((issue) => `${issue.path.join('.') || 'config'}: ${issue.message}`)
                .join('; ');
            errors.push(`${node.id} (${node.data.type}): ${issues}`);
        }
    }

    for (const edge of edges) {
        if (!nodeIds.has(edge.source)) errors.push(`edge ${edge.id}: unknown source node "${edge.source}"`);
        if (!nodeIds.has(edge.target)) errors.push(`edge ${edge.id}: unknown target node "${edge.target}"`);
    }

    const hasStartNode = nodes.some((node) => node.data.isStartNode === true || node.data.type === 'webhook-clone');
    if (nodes.length > 0 && !hasStartNode) {
        errors.push('the graph has no start node — set isStartNode: true on the first node');
    }

    return errors;
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
                    nodeType: z.string().min(1).describe('The node type to get detail for (e.g. "build-docker-image")'),
                },
            },
            async ({ nodeType }) => {
                const g = guard(ctx, 'repository', 'read');
                if (g) return g;
                const entry = PIPELINE_NODE_CATALOG.find((n) => n.type === nodeType);
                if (!entry)
                    return fail(`Unknown node type "${nodeType}". Call listPipelineNodes to see available types.`);
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
                const g = await guardRepository(ctx, repositoryId, 'repository', 'read');
                if (g) return g;
                try {
                    const repo = await prisma.repository.findUnique({
                        where: { id: repositoryId },
                        include: { gitAccount: true },
                    });

                    if (!repo) return fail(`Repository "${repositoryId}" not found`);
                    if (!repo.gitAccount) return fail('Repository has no linked git account — cannot read files');

                    const gitAccount = repo.gitAccount;

                    const rawToken = {
                        accessToken: decrypt(gitAccount.accessToken),
                        refreshToken: gitAccount.refreshToken ? decrypt(gitAccount.refreshToken) : null,
                        accessTokenExpiresAt: gitAccount.accessTokenExpiresAt,
                    };

                    const token = await getValidToken(rawToken, repo.gitProvider, ctx.userId, gitAccount.id);

                    const ref = branch ?? 'HEAD';

                    let reader: RepoReader;

                    if (repo.gitProvider === 'GITHUB') {
                        const { owner, repo: repoName } = getGitAdapter('GITHUB').parseRepoUrl(repo.repositoryUrl);
                        reader = githubReader(owner, repoName, ref);
                    } else if (repo.gitProvider === 'GITLAB') {
                        const { baseUrl } = getGitAdapter('GITLAB').parseRepoUrl(repo.repositoryUrl);
                        const url = new URL(repo.repositoryUrl);
                        const pathWithNamespace = url.pathname.replace(/^\//, '').replace(/\.git$/, '');
                        reader = gitlabReader(baseUrl, encodeURIComponent(pathWithNamespace), ref);
                    } else if (repo.gitProvider === 'GITEA') {
                        const {
                            baseUrl,
                            owner,
                            repo: repoName,
                        } = getGitAdapter('GITEA').parseRepoUrl(repo.repositoryUrl);
                        reader = giteaReader(baseUrl, owner, repoName, ref);
                    } else if (repo.gitProvider === 'BITBUCKET') {
                        const { owner, repo: repoName } = getGitAdapter('BITBUCKET').parseRepoUrl(repo.repositoryUrl);
                        reader = bitbucketReader(owner, repoName, ref);
                    } else if (repo.gitProvider === 'AZURE_REPOS') {
                        const { owner, repo: repoName } = getGitAdapter('AZURE_REPOS').parseRepoUrl(repo.repositoryUrl);
                        const [organization, project] = owner.split('/');
                        const azureBranch =
                            branch ??
                            (
                                await tokenGitStorage.run(token, () =>
                                    azureGetRepository(organization!, project!, repoName),
                                )
                            ).defaultBranch?.replace('refs/heads/', '') ??
                            'main';
                        reader = azureReposReader(organization!, project!, repoName, azureBranch);
                    } else {
                        return fail(`Unsupported git provider: ${repo.gitProvider}`);
                    }

                    const { rootFiles, files, recursive } = await tokenGitStorage.run(token, () =>
                        readRepository(reader),
                    );

                    const analysis = {
                        repositoryId: repo.id,
                        name: repo.name,
                        url: repo.repositoryUrl,
                        provider: repo.gitProvider,
                        ref,
                        rootFiles,
                        recursive,
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
            async ({ repositoryId, stageId, nodes, edges }) => {
                const g = await guardRepository(ctx, repositoryId, 'pipeline', 'update');
                if (g) return g;
                try {
                    const repo = await prisma.repository.findUnique({
                        where: { id: repositoryId },
                        select: { id: true, name: true },
                    });

                    if (!repo) return fail(`Repository "${repositoryId}" not found`);

                    const stage = await getFirstStage(repositoryId, stageId);
                    if (!stage) return fail('No deployment stage found for this repository');

                    const graphErrors = validateGraph(nodes as PipelineGraph['nodes'], edges as PipelineGraph['edges']);
                    if (graphErrors.length > 0) {
                        return fail(
                            `Invalid pipeline graph:\n- ${graphErrors.join('\n- ')}\nCall getPipelineNodeDetail for the affected node types, fix the graph, then call savePipeline again.`,
                        );
                    }

                    await savePipelineConfig({
                        repositoryId,
                        stageId: stage.id,
                        graph: {
                            nodes: nodes as PipelineGraph['nodes'],
                            edges: edges as PipelineGraph['edges'],
                        },
                    });

                    return ok(
                        `Pipeline saved for repository "${repo.name}" (stage "${stage.name}") — ${nodes.length} node(s), ${edges.length} edge(s). The pipeline is now ready to run.`,
                    );
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );
    },
};
