import { HTTPError } from 'ky';
import type { NodeExecutionResult, NodeOutputData, PipelineLogger } from '@/types/pipeline.type';

export async function runDockerAction(
    fn: () => Promise<unknown>,
    logger: PipelineLogger,
    nodeId: string,
    output: NodeOutputData,
): Promise<NodeExecutionResult | null> {
    try {
        await fn();
        return null;
    } catch (error) {
        if (error instanceof HTTPError && error.response.status === 409) {
            await logger.warn(nodeId, error.message);
            return { success: true, output };
        }
        throw error;
    }
}
