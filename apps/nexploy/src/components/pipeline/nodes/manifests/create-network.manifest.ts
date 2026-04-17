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
            name: 'create-network.name',
            description: 'create-network.description',
            icon: Network,
            color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: createNetworkConfigSchema,
    configPanel: CreateNetworkConfig,
    inputFields: [
        { key: 'networkId', labelKey: 'pipeline.inputs.networkId', descriptionKey: 'pipeline.inputs.desc_networkId', type: 'input' },
        { key: 'networkName', labelKey: 'pipeline.inputs.networkName', descriptionKey: 'pipeline.inputs.desc_networkName', type: 'input' },
    ],
};