import { Position } from '@xyflow/react';
import { pruneContainersConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { PruneContainersConfig } from '../config/PruneContainersConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { PackageX } from 'lucide-react';

export const pruneContainersManifest: NodeManifest = {
    type: 'prune-containers',
    definition: {
        id: 'prune-containers',
        type: 'base-node',
        category: 'utility',
        metadata: {
            name: 'prune-containers.name',
            description: 'prune-containers.description',
            icon: PackageX,
            color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: pruneContainersConfigSchema,
    configPanel: PruneContainersConfig,
    inputFields: [
        {
            key: 'removedContainers',
            labelKey: 'pipeline.inputs.removedContainers',
            descriptionKey: 'pipeline.inputs.desc_removedContainers',
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
