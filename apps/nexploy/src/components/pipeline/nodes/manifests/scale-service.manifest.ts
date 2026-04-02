import { scaleServiceConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ScaleServiceConfig } from '../config/ScaleServiceConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { Position } from '@xyflow/react';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const scaleServiceManifest: NodeManifest = {
    type: 'scale-service',
    definition: {
        id: 'scale-service',
        type: 'base-node',
        category: 'deploy',
        metadata: {
            name: 'pipeline.nodes.scale-service.name',
            description: 'pipeline.nodes.scale-service.description',
            icon: 'ArrowUpDown',
            color: `${CATEGORY_BG_MUTED['deploy']} ${CATEGORY_TEXT['deploy']}`,
        },
        defaultConfig: {
            serviceName: '',
            replicas: 1,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: scaleServiceConfigSchema,
    configPanel: ScaleServiceConfig,
};
