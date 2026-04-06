import { Position } from '@xyflow/react';
import { httpRequestConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { HttpRequestConfig } from '../config/HttpRequestConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Webhook } from 'lucide-react';

export const httpRequestManifest: NodeManifest = {
    type: 'http-request',
    definition: {
        id: 'http-request',
        type: 'base-node',
        category: 'integration',
        metadata: {
            name: 'http-request.name',
            description: 'http-request.description',
            icon: Webhook,
            color: `${CATEGORY_BG_MUTED['integration']} ${CATEGORY_TEXT['integration']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: httpRequestConfigSchema,
    configPanel: HttpRequestConfig,
};
