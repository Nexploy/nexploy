import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
    ResolvedConfig,
} from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { runCommandInContainerConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class RunCommandInContainerExecutor implements INodeExecutor {
    readonly type = 'run-command-in-container';
    readonly configSchema = runCommandInContainerConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolvedConfig<z.infer<typeof runCommandInContainerConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const containerName = nodeConfig.containerName;
        const command = nodeConfig.command;

        const workdir = nodeConfig.workdir;
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
            return { output: { exitCode: result.exitCode } };
        } catch (error) {
            throw new Error(
                `Failed to exec in container: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

export const runCommandInContainerExecutor = new RunCommandInContainerExecutor();
