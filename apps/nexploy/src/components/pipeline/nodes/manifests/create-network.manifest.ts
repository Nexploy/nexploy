import { createNetworkConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { createNetworkNodeDef } from '../definitions/create-network.node';
import { CreateNetworkConfig } from '../config/CreateNetworkConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const createNetworkManifest: NodeManifest = {
    type: 'create-network',
    definition: createNetworkNodeDef,
    configSchema: createNetworkConfigSchema,
    configPanel: CreateNetworkConfig,
};
