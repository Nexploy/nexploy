import { Position } from '@xyflow/react';
import { pruneImagesConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { PruneImagesConfig } from '../config/PruneImagesConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Trash2 } from 'lucide-react';

export const pruneImagesManifest: NodeManifest = {
    type: 'prune-images',
    definition: {
        id: 'prune-images',
        type: 'base-node',
        category: 'build',
        metadata: {
            name: 'prune-images.name',
            description: 'prune-images.description',
            icon: Trash2,
            color: `${CATEGORY_BG_MUTED['build']} ${CATEGORY_TEXT['build']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: pruneImagesConfigSchema,
    configPanel: PruneImagesConfig,
    inputFields: [
        { key: 'removedImages', labelKey: 'pipeline.inputs.removedImages', descriptionKey: 'pipeline.inputs.desc_removedImages', type: 'input' },
        { key: 'reclaimedSpace', labelKey: 'pipeline.inputs.reclaimedSpace', descriptionKey: 'pipeline.inputs.desc_reclaimedSpace', type: 'input' },
    ],
};