import { cacheSaveConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { cacheSaveNodeDef } from '../definitions/cache-save.node';
import { CacheSaveConfig } from '../config/CacheSaveConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const cacheSaveManifest: NodeManifest = {
    type: 'cache-save',
    definition: cacheSaveNodeDef,
    configSchema: cacheSaveConfigSchema,
    configPanel: CacheSaveConfig,
};
