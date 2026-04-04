import { Position } from '@xyflow/react';
import { cacheSaveConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { CacheSaveConfig } from '../config/CacheSaveConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { FolderOutput } from 'lucide-react';

export const cacheSaveManifest: NodeManifest = {
    type: 'cache-save',
    definition: {
        id: 'cache-save',
        type: 'base-node',
        category: 'utility',
        metadata: {
            name: 'pipeline.nodes.cache-save.name',
            description: 'pipeline.nodes.cache-save.description',
            icon: FolderOutput,
            color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: cacheSaveConfigSchema,
    configPanel: CacheSaveConfig,
};
