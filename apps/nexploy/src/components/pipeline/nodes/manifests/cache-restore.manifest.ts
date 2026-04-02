import { Position } from '@xyflow/react';
import { cacheRestoreConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { CacheRestoreConfig } from '../config/CacheRestoreConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const cacheRestoreManifest: NodeManifest = {
    type: 'cache-restore',
    definition: {
        id: 'cache-restore',
        type: 'base-node',
        category: 'utility',
        metadata: {
            name: 'pipeline.nodes.cache-restore.name',
            description: 'pipeline.nodes.cache-restore.description',
            icon: 'FolderInput',
            color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
        },
        defaultConfig: {
            volumeName: '',
            cachePath: 'node_modules',
            cacheKey: '',
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: cacheRestoreConfigSchema,
    configPanel: CacheRestoreConfig,
};
