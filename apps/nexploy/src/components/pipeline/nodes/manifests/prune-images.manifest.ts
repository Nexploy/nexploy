import { Position } from '@xyflow/react';
import { pruneImagesConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { PruneImagesConfig } from '../config/PruneImagesConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const pruneImagesManifest: NodeManifest = {
    type: 'prune-images',
    definition: {
        id: 'prune-images',
        type: 'base-node',
        category: 'build',
        metadata: {
            name: 'pipeline.nodes.prune-images.name',
            description: 'pipeline.nodes.prune-images.description',
            icon: 'Trash2',
            color: `${CATEGORY_BG_MUTED['build']} ${CATEGORY_TEXT['build']}`,
        },
        defaultConfig: {
            filter: '',
            olderThan: '',
            dangling: true,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: pruneImagesConfigSchema,
    configPanel: PruneImagesConfig,
};
