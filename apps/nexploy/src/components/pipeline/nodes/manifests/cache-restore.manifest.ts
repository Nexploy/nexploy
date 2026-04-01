import { cacheRestoreConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { cacheRestoreNodeDef } from '../definitions/cache-restore.node';
import { CacheRestoreConfig } from '../config/CacheRestoreConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const cacheRestoreManifest: NodeManifest = {
    type: 'cache-restore',
    definition: cacheRestoreNodeDef,
    configSchema: cacheRestoreConfigSchema,
    configPanel: CacheRestoreConfig,
};
