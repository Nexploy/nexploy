import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@workspace/typescript-interface/pipeline/pipeline';
import { removeDomainConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';
import { z } from 'zod';

export class RemoveDomainExecutor implements INodeExecutor {
    readonly type = 'remove-domain';
    readonly configSchema = removeDomainConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof removeDomainConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeId, nodeConfig, logger, abortSignal, services } = ctx;
        const { host } = nodeConfig;

        await logger.info(nodeId, `Removing domain: ${host}`);
        if (abortSignal.aborted) throw new Error('Build cancelled');

        const existingDomains = await services.domain.listDomains();
        const exists = existingDomains.some((d) => d.host === host);

        if (!exists) {
            await logger.info(nodeId, `Domain not found, skipping: ${host}`);
            return { output: { host, removed: false }, skipped: true };
        }

        const remainingDomains = existingDomains.filter((d) => d.host !== host);
        await services.domain.applyDomains(remainingDomains);

        await logger.info(nodeId, `Domain removed: ${host}`);

        return { output: { host, removed: true } };
    }
}

export const removeDomainExecutor = new RemoveDomainExecutor();
