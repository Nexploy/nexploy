import * as childProcess from 'node:child_process';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult, getFromAllOutputs } from '@/types/pipeline.type';

function execGit(args: string[], cwd: string): Promise<{ stdout: string; stderr: string; code: number }> {
    return new Promise((resolve) => {
        const proc = childProcess.spawn('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
        let stdout = '';
        let stderr = '';
        proc.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
        proc.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
        proc.on('close', (code) => resolve({ stdout, stderr, code: code ?? 1 }));
    });
}

export class GitTagExecutor implements INodeExecutor {
    readonly type = 'git-tag';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId } = ctx;

        const tagName = nodeConfig.tagName as string;
        const message = nodeConfig.message as string | undefined;
        const remote = (nodeConfig.remote as string | undefined) ?? 'origin';

        if (!tagName) throw new Error('Tag name is required');

        const workDir = getFromAllOutputs<string>(allOutputs, 'workDir');
        if (!workDir) throw new Error('No workDir found — run a clone node first');

        await logger.info(nodeId, `Creating git tag "${tagName}"${message ? ` with message: ${message}` : ''}`);

        // Create tag
        const tagArgs = message
            ? ['tag', '-a', tagName, '-m', message]
            : ['tag', tagName];

        const tagResult = await execGit(tagArgs, workDir);
        if (tagResult.code !== 0) {
            // If tag already exists, try to continue
            if (tagResult.stderr.includes('already exists')) {
                await logger.warn(nodeId, `Tag "${tagName}" already exists, skipping creation`);
            } else {
                throw new Error(`git tag failed: ${tagResult.stderr.trim()}`);
            }
        }

        // Push tag to remote
        await logger.info(nodeId, `Pushing tag "${tagName}" to remote "${remote}"`);
        const pushResult = await execGit(['push', remote, tagName], workDir);
        if (pushResult.code !== 0) {
            throw new Error(`git push tag failed: ${pushResult.stderr.trim()}`);
        }

        await logger.info(nodeId, `Tag "${tagName}" pushed to ${remote}`);
        return { success: true, output: { tagName, remote } };
    }
}

export const gitTagExecutor = new GitTagExecutor();
