import { pruneImagesConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { pruneImagesNodeDef } from '../definitions/prune-images.node';
import { PruneImagesConfig } from '../config/PruneImagesConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const pruneImagesManifest: NodeManifest = {
    type: 'prune-images',
    definition: pruneImagesNodeDef,
    configSchema: pruneImagesConfigSchema,
    configPanel: PruneImagesConfig,
};
