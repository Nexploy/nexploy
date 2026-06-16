import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@workspace/typescript-interface/pipeline/pipeline';
import { gitService } from '@/inngest/pipeline/services/git.service';

export class CleanWorkdirExecutor implements INodeExecutor {
    readonly type = 'clean-workdir';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { inputOutputs, allOutputs, logger, nodeId, edges } = ctx;

        const workDirFromInputs = inputOutputs
            .map((o) => o.workDir)
            .find((v): v is string => typeof v === 'string');

        const workDir = workDirFromInputs ?? getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'workDir');

        if (!workDir) {
            await logger.info(nodeId, 'No work directory to clean up');
            return { output: {}, skipped: true };
        }

        try {
            await gitService.cleanup(workDir);
            await logger.info(nodeId, `Work directory cleaned: ${workDir}`);
            return { output: { cleaned: workDir } };
        } catch (error) {
            await logger.warn(
                nodeId,
                `Cleanup warning: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            return { output: { cleaned: workDir } };
        }
    }
}

export const cleanWorkdirExecutor = new CleanWorkdirExecutor();
