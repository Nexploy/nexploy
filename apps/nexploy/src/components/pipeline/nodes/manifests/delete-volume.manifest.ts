import { Position } from '@xyflow/react';
import { deleteVolumeConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { DeleteVolumeConfig } from '../config/DeleteVolumeConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Trash2 } from 'lucide-react';

export const deleteVolumeManifest: NodeManifest = {
    type: 'delete-volume',
    definition: {
        id: 'delete-volume',
        type: 'base-node',
        category: 'utility',
        metadata: {
            name: 'delete-volume.name',
            description: 'delete-volume.description',
            icon: Trash2,
            color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: deleteVolumeConfigSchema,
    configPanel: DeleteVolumeConfig,
    inputFields: [
        {
            key: 'volumeName',
            labelKey: 'pipeline.inputs.volumeName',
            descriptionKey: 'pipeline.inputs.desc_volumeName',
            type: 'input',
        },
    ],
};
