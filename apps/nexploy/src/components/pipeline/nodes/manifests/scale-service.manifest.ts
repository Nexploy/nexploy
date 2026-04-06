import { scaleServiceConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ScaleServiceConfig } from '../config/ScaleServiceConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { Position } from '@xyflow/react';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { ArrowUpDown } from 'lucide-react';

export const scaleServiceManifest: NodeManifest = {
    type: 'scale-service',
    definition: {
        id: 'scale-service',
        type: 'base-node',
        category: 'deploy',
        metadata: {
            name: 'scale-service.name',
            description: 'scale-service.description',
            icon: ArrowUpDown,
            color: `${CATEGORY_BG_MUTED['deploy']} ${CATEGORY_TEXT['deploy']}`,
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
