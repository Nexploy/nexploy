import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { runCommandInContainerConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { safeContainerPath } from '@workspace/shared/pathSafety';
import { z } from 'zod';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';

export class RunCommandInContainerExecutor implements INodeExecutor {
    readonly type = 'run-command-in-container';
    readonly configSchema = runCommandInContainerConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof runCommandInContainerConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, edges } = ctx;

        const containerId = nodeConfig.containerId;
        const command = nodeConfig.command;
        const continueOnError = nodeConfig.continueOnError;

        const workdir = nodeConfig.workdir ? safeContainerPath(nodeConfig.workdir) : undefined;
        const environmentId = getFromClosestAncestor<string>(
            allOutputs,
            edges,
            nodeId,
            'environmentId',
        );

        await logger.info(nodeId, `Executing command in container "${containerId}": ${command}`);

        try {
            const result = await kyDocker
                .post(`container/${containerId}/exec`, {
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
                const msg = `Command exited with code ${result.exitCode}`;
                if (continueOnError) {
                    await logger.warn(nodeId, `${msg} (continuing due to continueOnError)`);
                    return { output: { exitCode: result.exitCode } };
                }
                throw new Error(msg);
            }

            await logger.info(nodeId, `Command completed successfully (exit code 0)`);
            return { output: { exitCode: result.exitCode } };
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') throw error;
            throw new Error(
                `Failed to exec in container: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

export const runCommandInContainerExecutor = new RunCommandInContainerExecutor();
