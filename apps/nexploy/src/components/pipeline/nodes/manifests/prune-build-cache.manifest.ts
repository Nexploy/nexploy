import { Position } from '@xyflow/react';
import { pruneBuildCacheConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { PruneBuildCacheConfig } from '../config/PruneBuildCacheConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Eraser } from 'lucide-react';

export const pruneBuildCacheManifest: NodeManifest = {
    type: 'prune-build-cache',
    definition: {
        id: 'prune-build-cache',
        type: 'base-node',
        category: 'build',
        metadata: {
            name: 'prune-build-cache.name',
            description: 'prune-build-cache.description',
            icon: Eraser,
            color: `${CATEGORY_BG_MUTED['build']} ${CATEGORY_TEXT['build']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: pruneBuildCacheConfigSchema,
    configPanel: PruneBuildCacheConfig,
    inputFields: [
        {
            key: 'deletedCaches',
            labelKey: 'pipeline.inputs.deletedCaches',
            descriptionKey: 'pipeline.inputs.desc_deletedCaches',
            type: 'input',
        },
        {
            key: 'reclaimedSpace',
            labelKey: 'pipeline.inputs.reclaimedSpace',
            descriptionKey: 'pipeline.inputs.desc_reclaimedSpace',
            type: 'input',
        },
    ],
};
