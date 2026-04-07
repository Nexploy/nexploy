import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { deployStackConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class DeployStackExecutor implements INodeExecutor {
    readonly type = 'deploy-stack';
    readonly configSchema = deployStackConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof deployStackConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const stackName = nodeConfig.stackName;
        const composeFilePath = nodeConfig.composeFilePath;
        const prune = nodeConfig.prune;

        const workDir = getFromAllOutputs<string>(allOutputs, 'workDir');
        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');

        await logger.info(nodeId, `Deploying Swarm stack "${stackName}" from ${composeFilePath}`);

        try {
            const result = await kyDocker
                .post('swarm/stacks/deploy', {
                    json: {
                        stackName,
                        composeFilePath,
                        prune,
                        ...(workDir && { workDir }),
                    },
                    signal: abortSignal,
                    environmentId,
                    timeout: 120000,
                } as KyDockerOptions)
                .json<{ services: number; updated: number; created: number }>();

            await logger.info(
                nodeId,
                `Stack "${stackName}" deployed (services: ${result.services ?? 0}, created: ${result.created ?? 0}, updated: ${result.updated ?? 0})`,
            );

            return {
                output: {
                    stackName,
                    services: result.services ?? 0,
                    created: result.created ?? 0,
                    updated: result.updated ?? 0,
                },
            };
        } catch (error) {
            throw new Error(
                `Failed to deploy stack: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

export const deployStackExecutor = new DeployStackExecutor();
