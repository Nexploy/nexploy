import { waitForUrlConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { WaitForUrlConfig } from '../config/WaitForUrlConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';
import { Globe } from 'lucide-react';

export const waitForUrlManifest: NodeManifest = {
    type: 'wait-for-url',
    definition: {
        id: 'wait-for-url',
        type: 'base-node',
        category: 'flow',
        metadata: {
            name: 'wait-for-url.name',
            description: 'wait-for-url.description',
            icon: Globe,
            color: `${CATEGORY_BG_MUTED['flow']} ${CATEGORY_TEXT['flow']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: waitForUrlConfigSchema,
    configPanel: WaitForUrlConfig,
    inputFields: [
        {
            key: 'url',
            labelKey: 'pipeline.inputs.url',
            descriptionKey: 'pipeline.inputs.desc_url',
            type: 'input',
        },
        {
            key: 'status',
            labelKey: 'pipeline.inputs.httpStatus',
            descriptionKey: 'pipeline.inputs.desc_httpStatus',
            type: 'input',
        },
    ],
};
