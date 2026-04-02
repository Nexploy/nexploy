import { updateServiceConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { UpdateServiceConfig } from '../config/UpdateServiceConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';

export const updateServiceManifest: NodeManifest = {
    type: 'update-service',
    definition: {
        id: 'update-service',
        type: 'base-node',
        category: 'deploy',
        metadata: {
            name: 'pipeline.nodes.update-service.name',
            description: 'pipeline.nodes.update-service.description',
            icon: 'RefreshCw',
            color: `${CATEGORY_BG_MUTED['deploy']} ${CATEGORY_TEXT['deploy']}`,
        },
        defaultConfig: {
            serviceName: '',
            image: '',
            tag: 'latest',
            forceUpdate: false,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: updateServiceConfigSchema,
    configPanel: UpdateServiceConfig,
};
