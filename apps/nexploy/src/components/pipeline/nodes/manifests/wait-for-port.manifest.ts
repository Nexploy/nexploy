import { waitForPortConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { WaitForPortConfig } from '../config/WaitForPortConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';
import { Network } from 'lucide-react';

export const waitForPortManifest: NodeManifest = {
    type: 'wait-for-port',
    definition: {
        id: 'wait-for-port',
        type: 'base-node',
        category: 'utility',
        metadata: {
            name: 'pipeline.nodes.wait-for-port.name',
            description: 'pipeline.nodes.wait-for-port.description',
            icon: Network,
            color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: waitForPortConfigSchema,
    configPanel: WaitForPortConfig,
};
