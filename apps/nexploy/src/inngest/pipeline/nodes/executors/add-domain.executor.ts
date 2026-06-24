import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@workspace/typescript-interface/pipeline/pipeline';
import { addDomainConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';
import { generateTraefikConfig, getDomainKey, getDomains } from '@/services/traefik.service';
import { provisionDomainDns } from '@/services/domainCloudflare.service';
import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import type { Domain } from '@workspace/schemas-zod/repository/domain.schema';
import { z } from 'zod';

export class AddDomainExecutor implements INodeExecutor {
    readonly type = 'add-domain';
    readonly configSchema = addDomainConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof addDomainConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeId, nodeConfig, allOutputs, edges, logger, abortSignal } = ctx;
        const {
            host,
            path,
            internalPath,
            stripPath,
            containerName,
            containerPort,
            https,
            certificateId,
            cloudflareCredentialId,
            cloudflareZoneId,
            cloudflareZoneName,
        } = nodeConfig;

        const environmentId = getFromClosestAncestor<string>(
            allOutputs,
            edges,
            nodeId,
            'environmentId',
        );

        await logger.info(nodeId, `Adding domain: ${host}`);
        if (abortSignal.aborted) throw new Error('Build cancelled');

        const existingDomains = await getDomains();
        const domainId = getDomainKey({ host });

        const alreadyExists = existingDomains.some((d) => d.host === host);
        if (alreadyExists) {
            await logger.info(nodeId, `Domain already exists, overwriting config: ${host}`);
        }

        const newDomain: Domain = {
            id: domainId,
            host,
            path,
            internalPath,
            stripPath,
            containerName,
            containerPort,
            https,
            certificateId,
            environmentId: environmentId ?? '',
            cloudflareCredentialId,
            cloudflareZoneId,
            cloudflareZoneName,
        };

        if (cloudflareZoneId && cloudflareZoneName && cloudflareCredentialId) {
            await logger.info(nodeId, `Provisioning Cloudflare DNS for: ${host}`);
            newDomain.cloudflareDnsRecordId = await provisionDomainDns(newDomain, host);
        }

        const otherDomains = existingDomains.filter((d) => d.host !== host);

        await generateTraefikConfig([...otherDomains, newDomain]);

        await logger.info(
            nodeId,
            `Domain configured: ${host}:${containerPort}` +
                (environmentId ? ` (environment: ${environmentId})` : ''),
        );

        return { output: { host, containerPort, domainId, environmentId } };
    }
}

export const addDomainExecutor = new AddDomainExecutor();
