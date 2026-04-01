import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';

export class DelayExecutor implements INodeExecutor {
    readonly type = 'delay';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { nodeConfig, logger, nodeId, abortSignal } = ctx;

        const seconds = (nodeConfig.seconds as number | undefined) ?? 5;

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
