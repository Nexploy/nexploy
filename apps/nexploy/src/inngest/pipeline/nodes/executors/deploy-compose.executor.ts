import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@workspace/typescript-interface/pipeline/pipeline';
import { dockerService } from '@/inngest/pipeline/services/docker.service';
import { NEXPLOY_LABELS } from '@/lib/nexployLabels';
import { composeFileConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';

export class DeployComposeExecutor implements INodeExecutor {
    readonly type = 'deploy-compose';
    readonly configSchema = composeFileConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof composeFileConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { buildConfig, allOutputs, logger, nodeId, nodeConfig, abortSignal, edges } = ctx;

        const workDir = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'workDir');

        if (!workDir) {
            throw new Error(
                'No workDir found in input nodes — connect this node after a Clone Repository node',
            );
        }

        const composeFileName = nodeConfig.composeFileName;
        const composeFilePath = nodeConfig.composeFilePath;
        const composePath = composeFilePath
            ? `${composeFilePath.replace(/\/$/, '')}/${composeFileName}`
            : composeFileName;
        const projectName = `nexploy-${buildConfig.repositoryId}`;

        const envVarsArray =
            getFromClosestAncestor<{ key: string; value: string }[]>(
                allOutputs,
                edges,
                nodeId,
                'envVariables',
            ) ?? [];
        const envVars: Record<string, string> = Object.fromEntries(
            envVarsArray.map((e) => [e.key, e.value]),
        );

        const branch = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'branch');
        const commitHash = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'commitHash');
        const commitMessage = getFromClosestAncestor<string>(
            allOutputs,
            edges,
            nodeId,
            'commitMessage',
        );

        const labels: Record<string, string> = {
            [NEXPLOY_LABELS.repositoryId]: buildConfig.repositoryId,
            [NEXPLOY_LABELS.buildId]: buildConfig.buildId,
            ...(branch && { [NEXPLOY_LABELS.branch]: branch }),
            ...(commitHash && { [NEXPLOY_LABELS.commitHash]: commitHash }),
            ...(commitMessage && { [NEXPLOY_LABELS.commitMessage]: commitMessage }),
        };

        await logger.info(nodeId, `Deploying Docker Compose stack: ${projectName}`);

        const onLog = async (message: string) => logger.info(nodeId, message);

        const environmentId = getFromClosestAncestor<string>(
            allOutputs,
            edges,
            nodeId,
            'environmentId',
        );

        try {
            const result = await dockerService.deployCompose(
                workDir,
                projectName,
                composePath,
                envVars,
                abortSignal,
                onLog,
                environmentId,
                buildConfig.buildId,
                buildConfig.repositoryId,
                labels,
            );

            await logger.info(
                nodeId,
                `Docker Compose stack deployed: ${projectName}${
                    result.containers ? ` (${result.containers.length} containers)` : ''
                }`,
            );

            return {
                output: {
                    projectName,
                    containers: result.containers ?? [],
                    composeConfig: result.composeConfig,
                },
            };
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') throw error;
            throw new Error(
                `Docker Compose deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

export const deployComposeExecutor = new DeployComposeExecutor();
