import { updateServiceConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { updateServiceNodeDef } from '../definitions/update-service.node';
import { UpdateServiceConfig } from '../config/UpdateServiceConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const updateServiceManifest: NodeManifest = {
    type: 'update-service',
    definition: updateServiceNodeDef,
    configSchema: updateServiceConfigSchema,
    configPanel: UpdateServiceConfig,
};
