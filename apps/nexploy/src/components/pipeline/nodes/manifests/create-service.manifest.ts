import { Position } from '@xyflow/react';
import { createServiceConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { CreateServiceConfig } from '../config/CreateServiceConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Layers } from 'lucide-react';

export const createServiceManifest: NodeManifest = {
    type: 'create-service',
    definition: {
        id: 'create-service',
        type: 'large-node',
        category: 'deploy',
        metadata: {
            name: 'create-service.name',
            description: 'create-service.description',
            icon: Layers,
            color: `${CATEGORY_BG_MUTED['deploy']} ${CATEGORY_TEXT['deploy']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: createServiceConfigSchema,
    configPanel: CreateServiceConfig,
    inputFields: [
        {
            key: 'serviceId',
            labelKey: 'pipeline.inputs.serviceId',
            descriptionKey: 'pipeline.inputs.desc_serviceId',
            type: 'input',
        },
        {
            key: 'serviceName',
            labelKey: 'pipeline.inputs.serviceName',
            descriptionKey: 'pipeline.inputs.desc_serviceName',
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
