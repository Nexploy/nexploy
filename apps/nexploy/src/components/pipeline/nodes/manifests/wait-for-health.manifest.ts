import { waitForHealthConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { WaitForHealthConfig } from '../config/WaitForHealthConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';
import { HeartPulse } from 'lucide-react';

export const waitForHealthManifest: NodeManifest = {
    type: 'wait-for-health',
    definition: {
        id: 'wait-for-health',
        type: 'base-node',
        category: 'flow',
        metadata: {
            name: 'wait-for-health.name',
            description: 'wait-for-health.description',
            icon: HeartPulse,
            color: `${CATEGORY_BG_MUTED['flow']} ${CATEGORY_TEXT['flow']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: waitForHealthConfigSchema,
    configPanel: WaitForHealthConfig,
    inputFields: [
        {
            key: 'containerName',
            labelKey: 'pipeline.inputs.containerName',
            descriptionKey: 'pipeline.inputs.desc_containerName',
            type: 'input',
        },
        {
            key: 'healthy',
            labelKey: 'pipeline.inputs.healthy',
            descriptionKey: 'pipeline.inputs.desc_healthy',
            type: 'input',
        },
    ],
};
