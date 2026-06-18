import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@workspace/typescript-interface/pipeline/pipeline';
import { addDomainConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { generateTraefikConfigForRepository, getDomainsFromTraefikConfig, } from '@/services/traefik.service';
import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import { z } from 'zod';

export class AddDomainExecutor implements INodeExecutor {
    readonly type = 'add-domain';
    readonly configSchema = addDomainConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof addDomainConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { nodeId, nodeConfig, buildConfig, allOutputs, edges, logger, abortSignal } = ctx;
        const { repositoryId, stageId } = buildConfig;
        const { host, path, internalPath, stripPath, containerPort, https, certificateId } =
            nodeConfig;

        const environmentId = getFromClosestAncestor<string>(
            allOutputs,
            edges,
            nodeId,
            'environmentId',
        );

        await logger.info(nodeId, `Adding domain: ${host}`);
        if (abortSignal.aborted) throw new Error('Build cancelled');

        const existingDomains = await getDomainsFromTraefikConfig(repositoryId);
        const stageSeg = stageId ? `${stageId}-` : '';
        const domainId = `repo-${repositoryId}-${stageSeg}${host}`;

        const alreadyExists = existingDomains.some(
            (d) => d.host === host && d.stageId === stageId,
        );
        if (alreadyExists) {
            await logger.info(nodeId, `Domain already exists, overwriting config: ${host}`);
        }

        // Keep domains of other stages (or other hosts) untouched.
        const otherDomains = existingDomains.filter(
            (d) => !(d.host === host && d.stageId === stageId),
        );
        const newDomain = {
            id: domainId,
            host,
            path,
            internalPath,
            stripPath,
            containerPort,
            https,
            certificateId: certificateId || undefined,
            environmentId,
            stageId,
        };

        await generateTraefikConfigForRepository(repositoryId, [...otherDomains, newDomain]);

        await logger.info(
            nodeId,
            environmentId
                ? `Domain configured: ${host}:${containerPort} (environment: ${environmentId})`
                : `Domain configured: ${host}:${containerPort}`,
        );

        return { output: { host, containerPort, domainId, environmentId } };
    }
}

export const addDomainExecutor = new AddDomainExecutor();
