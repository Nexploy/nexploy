import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { getNextVersionNumber, upsertVersion } from '@/services/inngest/version.inngest.service';

export class SaveVersionExecutor implements INodeExecutor {
    readonly type = 'save-version';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { buildConfig, logger, nodeId, inputNodes, allOutputs } = ctx;

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

        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');
        const branch = getFromAllOutputs<string>(allOutputs, 'branch');
        const commitHash = getFromAllOutputs<string>(allOutputs, 'commitHash');
        const commitMessage = getFromAllOutputs<string>(allOutputs, 'commitMessage');

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
