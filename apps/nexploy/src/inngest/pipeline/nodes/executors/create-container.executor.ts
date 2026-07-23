import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@workspace/typescript-interface/pipeline/pipeline';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { createContainerConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';
import { NEXPLOY_LABELS } from '@/lib/nexployLabels';
import { z } from 'zod';
import { getAllEnvsBuild } from '@/services/repository/build.service';

export class CreateContainerExecutor implements INodeExecutor {
    readonly type = 'create-container';
    readonly configSchema = createContainerConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof createContainerConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, buildConfig, logger, nodeId, abortSignal, edges } = ctx;

        const environmentId = getFromClosestAncestor<string>(
            allOutputs,
            edges,
            nodeId,
            'environmentId',
        );
        const containerName = nodeConfig.containerName;
        const imageName = nodeConfig.imageName;

        const repoEnvs = buildConfig.stageId ? await getAllEnvsBuild(buildConfig.stageId) : [];
        const envVarMap = Object.fromEntries(repoEnvs.map((e) => [e.key, e.value]));
        for (const e of [...(nodeConfig.envVarsSource ?? []), ...nodeConfig.envVars]) {
            envVarMap[e.key] = e.value;
        }
        const envVars = Object.entries(envVarMap).map(([key, value]) => ({ key, value }));

        await logger.info(
            nodeId,
            `Creating container from image: ${imageName}${containerName ? ` (name: ${containerName})` : ''}`,
        );

        const labels: Record<string, string> = {
            [NEXPLOY_LABELS.repositoryId]: buildConfig.repositoryId,
            [NEXPLOY_LABELS.buildId]: buildConfig.buildId,
        };

        try {
            const result = await kyDocker
                .post('container/create', {
                    json: {
                        name: containerName,
                        image: imageName,
                        restart: nodeConfig.restartPolicy,
                        network: nodeConfig.networkName || undefined,
                        autoRemove: false,
                        ports: [...(nodeConfig.portsSource ?? []), ...nodeConfig.ports],
                        envVars,
                        volumes: [...(nodeConfig.volumesSource ?? []), ...nodeConfig.volumes],
                        labels,
                    },
                    signal: abortSignal,
                    environmentId,
                } as KyDockerOptions)
                .json<{ id: string }>();

            await logger.info(nodeId, `Container created: ${result.id.slice(0, 12)}`);

            return {
                output: {
                    containerId: result.id,
                    containerName: containerName ?? result.id.slice(0, 12),
                    imageName,
                },
            };
        } catch (error) {
            throw new Error(
                `Failed to create container: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

export const createContainerExecutor = new CreateContainerExecutor();
