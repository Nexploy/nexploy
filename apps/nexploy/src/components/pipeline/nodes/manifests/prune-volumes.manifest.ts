import { Position } from '@xyflow/react';
import { pruneVolumesConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { PruneVolumesConfig } from '../config/PruneVolumesConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { DatabaseZap } from 'lucide-react';

export const pruneVolumesManifest: NodeManifest = {
    type: 'prune-volumes',
    definition: {
        id: 'prune-volumes',
        type: 'base-node',
        category: 'utility',
        metadata: {
            name: 'prune-volumes.name',
            description: 'prune-volumes.description',
            icon: DatabaseZap,
            color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: pruneVolumesConfigSchema,
    configPanel: PruneVolumesConfig,
    inputFields: [
        {
            key: 'removedVolumes',
            labelKey: 'pipeline.inputs.removedVolumes',
            descriptionKey: 'pipeline.inputs.desc_removedVolumes',
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
