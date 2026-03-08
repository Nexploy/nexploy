import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
    getFromAllOutputs,
} from '@/types/pipeline.type';
import { gitService } from '@/inngest/pipeline/services/git.service';

export class CleanWorkdirExecutor implements INodeExecutor {
    readonly type = 'clean-workdir';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { inputOutputs, allOutputs, logger, nodeId } = ctx;

        // Look for workDir from direct inputs first, then anywhere in allOutputs
        const workDirFromInputs = inputOutputs
            .map((o) => o.workDir)
            .find((v): v is string => typeof v === 'string');

        const workDir =
            workDirFromInputs ?? getFromAllOutputs<string>(allOutputs, 'workDir');

        if (!workDir) {
            await logger.info(nodeId, 'No work directory to clean up');
            return { success: true, output: {}, skipped: true };
        }

        try {
            await gitService.cleanup(workDir);
            await logger.info(nodeId, `Work directory cleaned: ${workDir}`);
            return { success: true, output: { cleaned: workDir } };
        } catch (error) {
            await logger.warn(
                nodeId,
                `Cleanup warning: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            return { success: true, output: { cleaned: workDir } };
        }
    }
}

export const cleanWorkdirExecutor = new CleanWorkdirExecutor();
