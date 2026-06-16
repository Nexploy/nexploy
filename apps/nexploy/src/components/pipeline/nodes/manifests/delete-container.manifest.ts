import { Position } from '@xyflow/react';
import { deleteContainerConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { DeleteContainerConfig } from '../config/DeleteContainerConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Trash2 } from 'lucide-react';

export const deleteContainerManifest: NodeManifest = {
    type: 'delete-container',
    definition: {
        id: 'delete-container',
        type: 'base-node',
        category: 'deploy',
        metadata: {
            name: 'delete-container.name',
            description: 'delete-container.description',
            icon: Trash2,
            color: `${CATEGORY_BG_MUTED['deploy']} ${CATEGORY_TEXT['deploy']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: deleteContainerConfigSchema,
    configPanel: DeleteContainerConfig,
    inputFields: [
        {
            key: 'containerId',
            labelKey: 'pipeline.inputs.containerId',
            descriptionKey: 'pipeline.inputs.desc_containerId',
            type: 'input',
        },
    ],
};
