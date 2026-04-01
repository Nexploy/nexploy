import { INodeExecutor, NodeExecutionContext, NodeExecutionResult, getFromAllOutputs } from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';

export class RunCommandInContainerExecutor implements INodeExecutor {
    readonly type = 'run-command-in-container';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const containerName = nodeConfig.containerName as string;
        const command = nodeConfig.command as string;
        if (!containerName) throw new Error('Container name is required');
        if (!command) throw new Error('Command is required');

        const workdir = nodeConfig.workdir as string | undefined;
        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');

        await logger.info(nodeId, `Executing command in container "${containerName}": ${command}`);

        try {
            const result = await kyDocker
                .post(`containers/${encodeURIComponent(containerName)}/exec`, {
                    json: {
                        command,
                        ...(workdir && { workdir }),
                    },
                    signal: abortSignal,
                    environmentId,
                } as KyDockerOptions)
                .json<{ exitCode: number; output?: string }>();

            if (result.output) {
                await logger.info(nodeId, result.output);
            }

            if (result.exitCode !== 0) {
                throw new Error(`Command exited with code ${result.exitCode}`);
            }

            await logger.info(nodeId, `Command completed successfully (exit code 0)`);
            return { success: true, output: { exitCode: result.exitCode } };
        } catch (error) {
            throw new Error(`Failed to exec in container: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export const runCommandInContainerExecutor = new RunCommandInContainerExecutor();
