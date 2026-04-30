import { getFromClosestAncestor } from '@/types/pipeline.helpers';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { getNextVersionNumber, upsertVersion } from '@/services/inngest/version.inngest.service';
import { getDefaultEnvironment } from '@/services/environment/environment.service';

export class SaveVersionExecutor implements INodeExecutor {
    readonly type = 'save-version';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { buildConfig, logger, nodeId, inputNodes, allOutputs, edges } = ctx;

        await logger.info(nodeId, 'Saving version...');

        let composeConfig = undefined;
        for (const inputNode of inputNodes) {
            if (inputNode.type === 'deploy-compose') {
                const deployOutput = allOutputs.get(inputNode.id);
                if (deployOutput?.composeConfig && typeof deployOutput.composeConfig === 'string') {
                    composeConfig = deployOutput.composeConfig;
                    break;
                }
            }
        }

        let environmentId = getFromClosestAncestor<string>(
            allOutputs,
            edges,
            nodeId,
            'environmentId',
        );
        if (!environmentId) {
            const defaultEnv = await getDefaultEnvironment();
            environmentId = defaultEnv?.id;
        }

        const branch = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'branch');
        const commitHash = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'commitHash');
        const commitMessage = getFromClosestAncestor<string>(
            allOutputs,
            edges,
            nodeId,
            'commitMessage',
        );

        const versionNumber = await getNextVersionNumber(buildConfig.repositoryId, environmentId);

        await upsertVersion({
            repositoryId: buildConfig.repositoryId,
            imageTag: buildConfig.buildId,
            versionNumber,
            branch,
            commitHash,
            commitMessage,
            environmentId,
            composeConfig,
        });

        await logger.info(nodeId, `Version v${versionNumber} saved`);

        return {
            output: { versionNumber },
        };
    }
}

export const saveVersionExecutor = new SaveVersionExecutor();
