import { Position } from '@xyflow/react';
import { cacheRestoreConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { CacheRestoreConfig } from '../config/CacheRestoreConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { FolderInput } from 'lucide-react';

export const cacheRestoreManifest: NodeManifest = {
    type: 'cache-restore',
    definition: {
        id: 'cache-restore',
        type: 'base-node',
        category: 'files',
        metadata: {
            name: 'cache-restore.name',
            description: 'cache-restore.description',
            icon: FolderInput,
            color: `${CATEGORY_BG_MUTED['files']} ${CATEGORY_TEXT['files']}`,
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
