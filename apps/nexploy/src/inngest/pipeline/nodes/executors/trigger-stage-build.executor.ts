import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@workspace/typescript-interface/pipeline/pipeline';
import { triggerStageBuildConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { startBuildRepository } from '@/services/repository/build.service';
import { getFirstStage } from '@/services/repository/deploymentStage.service';
import { z } from 'zod';

export class TriggerStageBuildExecutor implements INodeExecutor {
    readonly type = 'trigger-stage-build';
    readonly configSchema = triggerStageBuildConfigSchema;
    readonly runsOnPipelineFailure = true;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof triggerStageBuildConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { nodeId, nodeConfig, buildConfig, logger, abortSignal, pipelineHasFailed } = ctx;

        const { stageId: targetStageId, triggerOnFailure } = nodeConfig;

        if (pipelineHasFailed && !triggerOnFailure) {
            await logger.info(nodeId, 'Pipeline failed — skipping downstream stage build trigger');
            return { output: { triggered: false }, skipped: true };
        }

        if (!targetStageId) {
            throw new Error('No target stage configured for trigger-stage-build node');
        }

        if (targetStageId === buildConfig.stageId) {
            throw new Error(
                'Trigger Stage Build cannot target the stage it is running in (would loop indefinitely)',
            );
        }

        const targetStage = await getFirstStage(buildConfig.repositoryId, targetStageId);
        if (!targetStage) {
            throw new Error(
                `Target stage ${targetStageId} not found in this repository — it may have been deleted`,
            );
        }

        if (abortSignal.aborted) throw new Error('Build cancelled');

        await logger.info(nodeId, `Triggering build on stage "${targetStage.name}"`);

        const triggeredByStageId = pipelineHasFailed ? undefined : buildConfig.stageId;

        const triggered = await startBuildRepository(
            {
                repositoryId: buildConfig.repositoryId,
                branch: buildConfig.gitBranch,
                stageId: targetStage.id,
            },
            buildConfig.userId,
            'manual',
            triggeredByStageId,
        );

        await logger.info(
            nodeId,
            `Started build #${triggered.numberBuild} on stage "${targetStage.name}"`,
        );

        return {
            output: {
                triggered: true,
                triggeredStageId: targetStage.id,
                triggeredBuildId: triggered.id,
            },
        };
    }
}

export const triggerStageBuildExecutor = new TriggerStageBuildExecutor();
