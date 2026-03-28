import { pullImageConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { pullImageNodeDef } from '../definitions/pull-image.node';
import { PullImageConfig } from '../config/PullImageConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const pullImageManifest: NodeManifest = {
    type: 'pull-image',
    definition: pullImageNodeDef,
    configSchema: pullImageConfigSchema,
    configPanel: PullImageConfig,
};
