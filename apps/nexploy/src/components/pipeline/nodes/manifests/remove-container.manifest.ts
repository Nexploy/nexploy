import { Position } from '@xyflow/react';
import { removeContainerConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { RemoveContainerConfig } from '../config/RemoveContainerConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { CircleX } from 'lucide-react';

export const removeContainerManifest: NodeManifest = {
    type: 'remove-container',
    definition: {
        id: 'remove-container',
        type: 'base-node',
        category: 'deploy',
        metadata: {
            name: 'remove-container.name',
            description: 'remove-container.description',
            icon: CircleX,
            color: `${CATEGORY_BG_MUTED['deploy']} ${CATEGORY_TEXT['deploy']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: removeContainerConfigSchema,
    configPanel: RemoveContainerConfig,
    inputFields: [
        {
            key: 'containerId',
            labelKey: 'pipeline.inputs.containerId',
            descriptionKey: 'pipeline.inputs.desc_containerId',
            type: 'input',
        },
    ],
};
