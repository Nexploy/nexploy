import { Position } from '@xyflow/react';
import { delayConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { DelayConfig } from '../config/DelayConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const delayManifest: NodeManifest = {
    type: 'delay',
    definition: {
        id: 'delay',
        type: 'base-node',
        category: 'utility',
        metadata: {
            name: 'pipeline.nodes.delay.name',
            description: 'pipeline.nodes.delay.description',
            icon: 'Timer',
            color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
        },
        defaultConfig: {
            seconds: 5,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: delayConfigSchema,
    configPanel: DelayConfig,
};
