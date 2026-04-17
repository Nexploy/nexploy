import { Position } from '@xyflow/react';
import { deployContainerConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { DeployContainerConfig } from '../config/DeployContainerConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Rocket } from 'lucide-react';

export const deployContainerManifest: NodeManifest = {
    type: 'deploy-container',
    definition: {
        id: 'deploy-container',
        type: 'large-node',
        category: 'deploy',
        metadata: {
            name: 'deploy-container.name',
            description: 'deploy-container.description',
            icon: Rocket,
            color: `${CATEGORY_BG_MUTED['deploy']} ${CATEGORY_TEXT['deploy']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [{ id: 'save-version', position: Position.Bottom }],
        },
    },
    configSchema: deployContainerConfigSchema,
    configPanel: DeployContainerConfig,
    inputFields: [
        { key: 'containerId', labelKey: 'pipeline.inputs.containerId', descriptionKey: 'pipeline.inputs.desc_containerId', type: 'input' },
        { key: 'imageName', labelKey: 'pipeline.inputs.imageName', descriptionKey: 'pipeline.inputs.desc_imageName', type: 'input' },
    ],
};
