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
        category: 'flow',
        metadata: {
            name: 'wait-for-port.name',
            description: 'wait-for-port.description',
            icon: Network,
            color: `${CATEGORY_BG_MUTED['flow']} ${CATEGORY_TEXT['flow']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: waitForPortConfigSchema,
    configPanel: WaitForPortConfig,
    inputFields: [
        { key: 'containerId', labelKey: 'pipeline.inputs.containerId', descriptionKey: 'pipeline.inputs.desc_containerId', type: 'input' },
        { key: 'port', labelKey: 'pipeline.inputs.port', descriptionKey: 'pipeline.inputs.desc_port', type: 'input' },
        { key: 'open', labelKey: 'pipeline.inputs.open', descriptionKey: 'pipeline.inputs.desc_open', type: 'input' },
    ],
};