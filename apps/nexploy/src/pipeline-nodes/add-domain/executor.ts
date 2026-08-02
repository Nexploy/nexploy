import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@workspace/pipeline-core/pipeline';
import { addDomainConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/pipeline-core/schemas/nodeFieldRef.schema';
import { getFromClosestAncestor } from '@workspace/pipeline-core/helpers';
import type { DomainRoute } from '@workspace/pipeline-core/nodeServices';
import { z } from 'zod';

export class AddDomainExecutor implements INodeExecutor {
    readonly type = 'add-domain';
    readonly configSchema = addDomainConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof addDomainConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeId, nodeConfig, allOutputs, edges, logger, abortSignal, services } = ctx;
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

        const environmentId = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'environmentId');

        await logger.info(nodeId, `Adding domain: ${host}`);
        if (abortSignal.aborted) throw new Error('Build cancelled');

        const existingDomains = await services.domain.listDomains();
        const domainId = services.domain.getDomainKey(host);

        const alreadyExists = existingDomains.some((d) => d.host === host);
        if (alreadyExists) {
            await logger.info(nodeId, `Domain already exists, overwriting config: ${host}`);
        }

        const newDomain: DomainRoute = {
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
            newDomain.cloudflareDnsRecordId = await services.domain.provisionDns(newDomain, host);
        }

        const otherDomains = existingDomains.filter((d) => d.host !== host);

        await services.domain.applyDomains([...otherDomains, newDomain]);

        await logger.info(
            nodeId,
            `Domain configured: ${host}:${containerPort}` + (environmentId ? ` (environment: ${environmentId})` : ''),
        );

        return { output: { host, containerPort, domainId, environmentId } };
    }
}

export const addDomainExecutor = new AddDomainExecutor();
