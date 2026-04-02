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
        category: 'utility',
        metadata: {
            name: 'pipeline.nodes.wait-for-url.name',
            description: 'pipeline.nodes.wait-for-url.description',
            icon: Globe,
            color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
        },
        defaultConfig: {
            url: '',
            expectedStatus: 200,
            timeout: 60,
            interval: 5,
            method: 'GET',
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: waitForUrlConfigSchema,
    configPanel: WaitForUrlConfig,
};
