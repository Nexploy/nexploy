import { Position } from '@xyflow/react';
import { createContainerConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { CreateContainerConfig } from '../config/CreateContainerConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { PackagePlus } from 'lucide-react';

export const createContainerManifest: NodeManifest = {
    type: 'create-container',
    definition: {
        id: 'create-container',
        type: 'large-node',
        category: 'deploy',
        metadata: {
            name: 'create-container.name',
            description: 'create-container.description',
            icon: PackagePlus,
            color: `${CATEGORY_BG_MUTED['deploy']} ${CATEGORY_TEXT['deploy']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [{ id: 'save-version', position: Position.Bottom }],
        },
    },
    configSchema: createContainerConfigSchema,
    configPanel: CreateContainerConfig,
    inputFields: [
        {
            key: 'containerId',
            labelKey: 'pipeline.inputs.containerId',
            descriptionKey: 'pipeline.inputs.desc_containerId',
            type: 'input',
        },
        {
            key: 'containerName',
            labelKey: 'pipeline.inputs.containerName',
            descriptionKey: 'pipeline.inputs.desc_containerName',
            type: 'input',
        },
        {
            key: 'imageName',
            labelKey: 'pipeline.inputs.imageName',
            descriptionKey: 'pipeline.inputs.desc_imageName',
            type: 'input',
        },
    ],
};
