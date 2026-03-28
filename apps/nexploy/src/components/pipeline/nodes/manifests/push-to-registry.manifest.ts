import { pushToRegistryConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { pushToRegistryNodeDef } from '../definitions/push-to-registry.node';
import { PushToRegistryConfig } from '../config/PushToRegistryConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const pushToRegistryManifest: NodeManifest = {
    type: 'push-to-registry',
    definition: pushToRegistryNodeDef,
    configSchema: pushToRegistryConfigSchema,
    configPanel: PushToRegistryConfig,
};
