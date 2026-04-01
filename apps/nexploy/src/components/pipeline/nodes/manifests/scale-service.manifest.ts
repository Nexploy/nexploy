import { scaleServiceConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { scaleServiceNodeDef } from '../definitions/scale-service.node';
import { ScaleServiceConfig } from '../config/ScaleServiceConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const scaleServiceManifest: NodeManifest = {
    type: 'scale-service',
    definition: scaleServiceNodeDef,
    configSchema: scaleServiceConfigSchema,
    configPanel: ScaleServiceConfig,
};
