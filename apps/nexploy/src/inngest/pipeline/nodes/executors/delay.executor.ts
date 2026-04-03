import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { delayConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export class DelayExecutor implements INodeExecutor {
    readonly type = 'delay';
    readonly configSchema = delayConfigSchema;

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { nodeConfig, logger, nodeId, abortSignal } = ctx;

        const seconds = nodeConfig.seconds as number;

        await logger.info(nodeId, `Delaying pipeline by ${seconds} second(s)`);

        await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(resolve, seconds * 1000);
            abortSignal.addEventListener('abort', () => {
                clearTimeout(timer);
                reject(new Error('Aborted'));
            });
        });

        await logger.info(nodeId, `Delay of ${seconds}s complete`);
        return { success: true, output: { delayed: seconds } };
    }
}

export const delayExecutor = new DelayExecutor();
