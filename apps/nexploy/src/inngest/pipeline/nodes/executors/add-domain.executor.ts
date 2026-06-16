import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@workspace/typescript-interface/pipeline/pipeline';
import { addDomainConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { generateTraefikConfigForRepository, getDomainsFromTraefikConfig, } from '@/services/traefik.service';
import { z } from 'zod';

export class AddDomainExecutor implements INodeExecutor {
    readonly type = 'add-domain';
    readonly configSchema = addDomainConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof addDomainConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { nodeId, nodeConfig, buildConfig, logger, abortSignal } = ctx;
        const { repositoryId } = buildConfig;
        const { host, path, internalPath, stripPath, containerPort, https, certificateId } =
            nodeConfig;

        await logger.info(nodeId, `Adding domain: ${host}`);
        if (abortSignal.aborted) throw new Error('Build cancelled');

        const existingDomains = await getDomainsFromTraefikConfig(repositoryId);
        const domainId = `repo-${repositoryId}-${host}`;

        const alreadyExists = existingDomains.some((d) => d.host === host);
        if (alreadyExists) {
            await logger.info(nodeId, `Domain already exists, skipping: ${host}`);
            return { output: { host, domainId, containerPort, skipped: true }, skipped: true };
        }

        const otherDomains = existingDomains.filter((d) => d.host !== host);
        const newDomain = {
            id: domainId,
            host,
            path,
            internalPath,
            stripPath,
            containerPort,
            https,
            certificateId: certificateId || undefined,
        };

        await generateTraefikConfigForRepository(repositoryId, [...otherDomains, newDomain]);

        await logger.info(nodeId, `Domain configured: ${host}:${containerPort}`);

        return { output: { host, containerPort, domainId } };
    }
}

export const addDomainExecutor = new AddDomainExecutor();
