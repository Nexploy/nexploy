import { createVolumeConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { createVolumeNodeDef } from '../definitions/create-volume.node';
import { CreateVolumeConfig } from '../config/CreateVolumeConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const createVolumeManifest: NodeManifest = {
    type: 'create-volume',
    definition: createVolumeNodeDef,
    configSchema: createVolumeConfigSchema,
    configPanel: CreateVolumeConfig,
};
