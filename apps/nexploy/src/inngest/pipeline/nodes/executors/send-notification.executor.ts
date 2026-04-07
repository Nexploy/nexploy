import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { sendNotificationConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class SendNotificationExecutor implements INodeExecutor {
    readonly type = 'send-notification';
    readonly configSchema = sendNotificationConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof sendNotificationConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { logger, nodeId, nodeConfig, abortSignal } = ctx;

        const webhookUrl = nodeConfig.webhookUrl;
        const customMessage = nodeConfig.message;

        const payload = {
            message: customMessage,
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
            return { output: { sent: true } };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to send notification: ${message}`);
        }
    }
}

export const sendNotificationExecutor = new SendNotificationExecutor();
