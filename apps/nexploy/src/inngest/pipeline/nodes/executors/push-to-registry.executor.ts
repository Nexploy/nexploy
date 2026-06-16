import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@workspace/typescript-interface/pipeline/pipeline';
import { dockerService } from '@/inngest/pipeline/services/docker.service';
import { getRegistryWithPassword } from '@/services/registry.service';
import { pushToRegistryConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';

export class PushToRegistryExecutor implements INodeExecutor {
    readonly type = 'push-to-registry';
    readonly configSchema = pushToRegistryConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof pushToRegistryConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { allOutputs, logger, nodeId, nodeConfig, abortSignal } = ctx;

        const registry = await getRegistryWithPassword(nodeConfig.registryId);
        if (!registry) {
            throw new Error(
                'No registry configured. Please select a registry in the node configuration or add one in Admin > Registry.',
            );
        }

        const auth = {
            serveraddress: registry.url,
            username: registry.username || '',
            password: registry.password || '',
        };

        const commitHash = [...allOutputs.values()]
            .map((o) => o['commitHash'])
            .find((v) => typeof v === 'string') as string | undefined;

        const customTag = commitHash ?? 'latest';
        const environmentId = [...allOutputs.values()]
            .map((o) => o['environmentId'])
            .find((v) => typeof v === 'string') as string | undefined;

        const configImageName = nodeConfig.imageName?.trim();
        const imageNames: string[] = configImageName
            ? [configImageName]
            : [...allOutputs.values()]
                  .map((o) => o['imageName'])
                  .filter((v): v is string => typeof v === 'string');

        if (imageNames.length === 0) {
            await logger.warn(
                nodeId,
                'No built images found — connect this node after one or more Build Docker Image nodes, or specify an image name in the configuration',
            );
            return { output: {}, skipped: true };
        }

        await logger.info(nodeId, `Pushing ${imageNames.length} image(s) to ${registry.url}`);

        const pushedNames: string[] = [];

        for (const imageName of imageNames) {
            const baseImageName = imageName.split(':')[0];
            const targetName = `${registry.url}/${baseImageName}:${customTag}`;

            await logger.info(nodeId, `Pushing ${imageName} → ${targetName}`);

            const onLog = async (message: string) => logger.info(nodeId, message);

            const result = await dockerService.pushToRegistry(
                imageName,
                targetName,
                auth,
                abortSignal,
                onLog,
                environmentId,
            );

            await logger.info(nodeId, `Pushed successfully: ${result.targetName}`);
            pushedNames.push(result.targetName);
        }

        return {
            output: {
                pushedImages: pushedNames,
                registryUrl: registry.url,
                tag: customTag,
            },
        };
    }
}

export const pushToRegistryExecutor = new PushToRegistryExecutor();
