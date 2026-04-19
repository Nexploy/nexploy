import { Position } from '@xyflow/react';
import { deleteNetworkConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { DeleteNetworkConfig } from '../config/DeleteNetworkConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Trash2 } from 'lucide-react';

export const deleteNetworkManifest: NodeManifest = {
    type: 'delete-network',
    definition: {
        id: 'delete-network',
        type: 'base-node',
        category: 'utility',
        metadata: {
            name: 'delete-network.name',
            description: 'delete-network.description',
            icon: Trash2,
            color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: deleteNetworkConfigSchema,
    configPanel: DeleteNetworkConfig,
    inputFields: [
        {
            key: 'networkName',
            labelKey: 'pipeline.inputs.networkName',
            descriptionKey: 'pipeline.inputs.desc_networkName',
            type: 'input',
        },
    ],
};
