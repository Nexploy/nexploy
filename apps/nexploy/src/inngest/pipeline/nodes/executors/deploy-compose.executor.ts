import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { dockerService } from '@/inngest/pipeline/services/docker.service';
import { NEXPLOY_LABELS } from '@/lib/nexployLabels';

export class DeployComposeExecutor implements INodeExecutor {
    readonly type = 'deploy-compose';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { config, allOutputs, logger, nodeId, nodeConfig, abortSignal } = ctx;

        const workDir = getFromAllOutputs<string>(allOutputs, 'workDir');

        if (!workDir) {
            throw new Error(
                'No workDir found in input nodes — connect this node after a Clone Repository node',
            );
        }

        const composeFileName =
            (nodeConfig.composeFileName as string | undefined) ?? 'docker-compose.yml';
        const composeFilePath = (nodeConfig.composeFilePath as string | undefined) ?? '';
        const composePath = composeFilePath
            ? `${composeFilePath.replace(/\/$/, '')}/${composeFileName}`
            : composeFileName;
        const projectName = `nexploy-${config.repositoryId}`;

        const envVars: Record<string, string> = { ...config.envVariables };
        for (const output of allOutputs.values()) {
            if (output.vars && typeof output.vars === 'object') {
                Object.assign(envVars, output.vars as Record<string, string>);
            }
        }

        const branch = getFromAllOutputs<string>(allOutputs, 'branch');
        const commitHash = getFromAllOutputs<string>(allOutputs, 'commitHash');
        const commitMessage = getFromAllOutputs<string>(allOutputs, 'commitMessage');

        const labels: Record<string, string> = {
            [NEXPLOY_LABELS.version]: 'true',
            [NEXPLOY_LABELS.repositoryId]: config.repositoryId,
            [NEXPLOY_LABELS.buildId]: config.imageTag,
            [NEXPLOY_LABELS.imageTag]: config.imageTag,
            ...(branch && { [NEXPLOY_LABELS.branch]: branch }),
            ...(commitHash && { [NEXPLOY_LABELS.commitHash]: commitHash }),
            ...(commitMessage && { [NEXPLOY_LABELS.commitMessage]: commitMessage }),
        };

        await logger.info(nodeId, `Deploying Docker Compose stack: ${projectName}`);

        const onLog = async (message: string) => logger.info(nodeId, message);

        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');

        try {
            const result = await dockerService.deployCompose(
                workDir,
                projectName,
                composePath,
                envVars,
                abortSignal,
                onLog,
                environmentId,
                config.imageTag,
                config.repositoryId,
                labels,
            );

            await logger.info(
                nodeId,
                `Docker Compose stack deployed: ${projectName}${
                    result.containers ? ` (${result.containers.length} containers)` : ''
                }`,
            );

            return {
                success: true,
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
