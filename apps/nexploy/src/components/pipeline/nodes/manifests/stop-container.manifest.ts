import { containerActionConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { StopContainerConfig } from '../config/StopContainerConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';
import { Square } from 'lucide-react';

export const stopContainerManifest: NodeManifest = {
    type: 'stop-container',
    definition: {
        id: 'stop-container',
        type: 'base-node',
        category: 'deploy',
        metadata: {
            name: 'pipeline.nodes.stop-container.name',
            description: 'pipeline.nodes.stop-container.description',
            icon: Square,
            color: `${CATEGORY_BG_MUTED['deploy']} ${CATEGORY_TEXT['deploy']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: containerActionConfigSchema,
    configPanel: StopContainerConfig,
};
