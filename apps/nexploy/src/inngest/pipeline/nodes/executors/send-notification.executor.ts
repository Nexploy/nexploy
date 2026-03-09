import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';

export class SendNotificationExecutor implements INodeExecutor {
    readonly type = 'send-notification';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { config, logger, nodeId, nodeConfig, abortSignal } = ctx;

        const webhookUrl = (nodeConfig.webhookUrl as string | undefined) ?? '';
        const customMessage = nodeConfig.message as string | undefined;

        if (!webhookUrl) {
            await logger.warn(nodeId, 'No webhook URL configured, skipping');
            return { success: true, output: { sent: false }, skipped: true };
        }

        const payload = {
            buildId: config.imageTag,
            repositoryId: config.repositoryId,
            message: customMessage ?? `Build ${config.imageTag} notification`,
            timestamp: new Date().toISOString(),
        };

        await logger.info(nodeId, `Sending notification to ${webhookUrl}`);

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: abortSignal,
            });

            if (!response.ok) {
                throw new Error(`Webhook returned ${response.status}: ${response.statusText}`);
            }

            await logger.info(nodeId, 'Notification sent successfully');
            return { success: true, output: { sent: true } };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to send notification: ${message}`);
        }
    }
}

export const sendNotificationExecutor = new SendNotificationExecutor();
