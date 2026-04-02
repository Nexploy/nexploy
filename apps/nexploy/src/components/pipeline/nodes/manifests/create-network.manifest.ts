import { Position } from '@xyflow/react';
import { createNetworkConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { CreateNetworkConfig } from '../config/CreateNetworkConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Network } from 'lucide-react';

export const createNetworkManifest: NodeManifest = {
    type: 'create-network',
    definition: {
        id: 'create-network',
        type: 'base-node',
        category: 'utility',
        metadata: {
            name: 'pipeline.nodes.create-network.name',
            description: 'pipeline.nodes.create-network.description',
            icon: Network,
            color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
        },
        defaultConfig: {
            name: '',
            driver: 'bridge',
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: createNetworkConfigSchema,
    configPanel: CreateNetworkConfig,
};
