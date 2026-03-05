import { BaseStep } from './base.step';
import { PipelineStatus, StepExecutionContext, StepMetadata, StepResult } from '@/types/pipeline.type';

type TriggerCondition = 'success' | 'failure' | 'always';

export class SendNotificationStep extends BaseStep {
    readonly metadata: StepMetadata;
    private readonly webhookUrl: string;
    private readonly triggerOn: TriggerCondition[];
    private readonly customMessage?: string;

    constructor(
        nodeId: string,
        webhookUrl: string,
        triggerOn: TriggerCondition[],
        message?: string,
    ) {
        super();
        this.webhookUrl = webhookUrl;
        this.triggerOn = triggerOn;
        this.customMessage = message;
        this.metadata = {
            id: `send-notification-${nodeId}`,
            name: 'Send Notification',
            description: 'Send a webhook notification',
            retryable: true,
            timeout: 30000,
        };
    }

    private shouldTrigger(status: PipelineStatus): boolean {
        if (this.triggerOn.includes('always')) return true;
        if (this.triggerOn.includes('success') && status === 'COMPLETED') return true;
        if (this.triggerOn.includes('failure') && status === 'FAILED') return true;
        return false;
    }

    async execute(ctx: StepExecutionContext): Promise<StepResult> {
        const status = 'BUILDING' as PipelineStatus;

        if (!this.shouldTrigger(status)) {
            await ctx.logger.info(this.metadata.id, 'Notification skipped (condition not met)');
            return this.skipped();
        }

        if (!this.webhookUrl) {
            await ctx.logger.warn(this.metadata.id, 'No webhook URL configured, skipping');
            return this.skipped();
        }

        const payload = {
            buildId: ctx.context.buildId,
            repositoryId: ctx.context.config.repositoryId,
            status,
            message: this.customMessage ?? `Build ${ctx.context.buildId} notification`,
            timestamp: new Date().toISOString(),
        };

        await ctx.logger.info(this.metadata.id, `Sending notification to ${this.webhookUrl}`);

        try {
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: ctx.context.abortController.signal,
            });

            if (!response.ok) {
                throw new Error(`Webhook returned ${response.status}: ${response.statusText}`);
            }

            await ctx.logger.info(this.metadata.id, 'Notification sent successfully');
            return this.success();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to send notification: ${message}`);
        }
    }
}
