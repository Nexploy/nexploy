import { containerActionConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { StartContainerConfig } from '../config/StartContainerConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';

export const startContainerManifest: NodeManifest = {
    type: 'start-container',
    definition: {
        id: 'start-container',
        type: 'base-node',
        category: 'deploy',
        metadata: {
            name: 'pipeline.nodes.start-container.name',
            description: 'pipeline.nodes.start-container.description',
            icon: 'Play',
            color: `${CATEGORY_BG_MUTED['deploy']} ${CATEGORY_TEXT['deploy']}`,
        },
        defaultConfig: {
            containerName: '',
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: containerActionConfigSchema,
    configPanel: StartContainerConfig,
};
