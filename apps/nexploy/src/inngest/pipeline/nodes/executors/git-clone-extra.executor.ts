import * as childProcess from 'node:child_process';
import * as path from 'node:path';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult, getFromAllOutputs } from '@/types/pipeline.type';
import { gitCloneExtraConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

function spawnGit(args: string[], cwd: string, env?: Record<string, string>): Promise<{ stdout: string; stderr: string; code: number }> {
    return new Promise((resolve) => {
        const proc = childProcess.spawn('git', args, {
            cwd,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: { ...process.env, GIT_TERMINAL_PROMPT: '0', ...env },
        });
        let stdout = '';
        let stderr = '';
        proc.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
        proc.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
        proc.on('close', (code) => resolve({ stdout, stderr, code: code ?? 1 }));
    });
}

export class GitCloneExtraExecutor implements INodeExecutor {
    readonly type = 'git-clone-extra';
    readonly configSchema = gitCloneExtraConfigSchema;

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId } = ctx;

        const repoUrl = nodeConfig.repoUrl as string;
        const branch = nodeConfig.branch as string;
        const targetDir = nodeConfig.targetDir as string;
        const token = nodeConfig.token as string | undefined;

        const workDir = getFromAllOutputs<string>(allOutputs, 'workDir');
        if (!workDir) throw new Error('No workDir found — run a clone node first');

        const cloneDest = path.isAbsolute(targetDir) ? targetDir : path.join(workDir, targetDir);

        // Inject token into URL if provided
        let cloneUrl = repoUrl;
        if (token) {
            try {
                const u = new URL(repoUrl);
                u.username = 'oauth2';
                u.password = token;
                cloneUrl = u.toString();
            } catch {
                // not a valid URL — use as-is
            }
        }

        await logger.info(nodeId, `Cloning extra repository → ${targetDir} (branch: ${branch})`);

        const result = await spawnGit(
            ['clone', '--branch', branch, '--depth', '1', cloneUrl, cloneDest],
            workDir,
        );

        if (result.code !== 0) {
            throw new Error(`git clone failed: ${result.stderr.trim()}`);
        }

        await logger.info(nodeId, `Repository cloned to ${targetDir}`);
        return { output: { repoUrl, branch, targetDir: cloneDest } };
    }
}

export const gitCloneExtraExecutor = new GitCloneExtraExecutor();
