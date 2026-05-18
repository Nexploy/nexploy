import { startContainerConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { StartContainerConfig } from '../config/StartContainerConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';
import { Play } from 'lucide-react';

export const startContainerManifest: NodeManifest = {
    type: 'start-container',
    definition: {
        id: 'start-container',
        type: 'base-node',
        category: 'deploy',
        metadata: {
            name: 'start-container.name',
            description: 'start-container.description',
            icon: Play,
            color: `${CATEGORY_BG_MUTED['deploy']} ${CATEGORY_TEXT['deploy']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: startContainerConfigSchema,
    configPanel: StartContainerConfig,
    inputFields: [
        {
            key: 'containerId',
            labelKey: 'pipeline.inputs.containerId',
            descriptionKey: 'pipeline.inputs.desc_containerId',
            type: 'input',
        },
    ],
};
