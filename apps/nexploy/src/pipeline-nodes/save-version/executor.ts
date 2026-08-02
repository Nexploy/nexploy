import { getFromClosestAncestor } from '@workspace/pipeline-core/helpers';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@workspace/pipeline-core/pipeline';

export class SaveVersionExecutor implements INodeExecutor {
    readonly type = 'save-version';
    readonly isAttachNode = true;

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { buildConfig, logger, nodeId, inputNodes, allOutputs, edges, services } = ctx;

        await logger.info(nodeId, 'Saving version...');

        let composeConfig = undefined;
        for (const inputNode of inputNodes) {
            if (inputNode.type === 'deploy-compose' || inputNode.type === 'compose-up') {
                const deployOutput = allOutputs.get(inputNode.id);
                if (deployOutput?.composeConfig && typeof deployOutput.composeConfig === 'string') {
                    composeConfig = deployOutput.composeConfig;
                    break;
                }
            }
        }

        let environmentId = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'environmentId');
        if (!environmentId) {
            environmentId = await services.environment.getDefaultEnvironmentId();
        }

        const branch = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'branch');
        const commitHash = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'commitHash');
        const commitMessage = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'commitMessage');

        const versionNumber = await services.version.getNextVersionNumber(buildConfig.repositoryId, environmentId);

        await services.version.saveVersion({
            repositoryId: buildConfig.repositoryId,
            imageTag: buildConfig.buildId,
            versionNumber,
            branch,
            commitHash,
            commitMessage,
            environmentId,
            stageId: buildConfig.stageId,
            composeConfig,
        });

        await logger.info(nodeId, `Version v${versionNumber} saved`);

        return {
            output: { versionNumber },
        };
    }
}

export const saveVersionExecutor = new SaveVersionExecutor();
