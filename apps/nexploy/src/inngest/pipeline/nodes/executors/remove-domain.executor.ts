import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@workspace/typescript-interface/pipeline/pipeline';
import { removeDomainConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';
import {
    generateTraefikConfigForRepository,
    getDomainsFromTraefikConfig,
} from '@/services/traefik.service';
import { z } from 'zod';

export class RemoveDomainExecutor implements INodeExecutor {
    readonly type = 'remove-domain';
    readonly configSchema = removeDomainConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof removeDomainConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeId, nodeConfig, buildConfig, logger, abortSignal } = ctx;
        const { repositoryId, stageId } = buildConfig;
        const { host } = nodeConfig;

        await logger.info(nodeId, `Removing domain: ${host}`);
        if (abortSignal.aborted) throw new Error('Build cancelled');

        const existingDomains = await getDomainsFromTraefikConfig(repositoryId);
        const exists = existingDomains.some((d) => d.host === host && d.stageId === stageId);

        if (!exists) {
            await logger.info(nodeId, `Domain not found, skipping: ${host}`);
            return { output: { host, removed: false }, skipped: true };
        }

        const remainingDomains = existingDomains.filter(
            (d) => !(d.host === host && d.stageId === stageId),
        );
        await generateTraefikConfigForRepository(repositoryId, remainingDomains);

        await logger.info(nodeId, `Domain removed: ${host}`);

        return { output: { host, removed: true } };
    }
}

export const removeDomainExecutor = new RemoveDomainExecutor();
