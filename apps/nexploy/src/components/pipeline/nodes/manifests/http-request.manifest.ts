import { Position } from '@xyflow/react';
import { httpRequestConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { HttpRequestConfig } from '../config/HttpRequestConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const httpRequestManifest: NodeManifest = {
    type: 'http-request',
    definition: {
        id: 'http-request',
        type: 'base-node',
        category: 'utility',
        metadata: {
            name: 'pipeline.nodes.http-request.name',
            description: 'pipeline.nodes.http-request.description',
            icon: 'Webhook',
            color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
        },
        defaultConfig: {
            url: '',
            method: 'POST',
            headers: [],
            body: '',
            expectedStatus: 200,
            continueOnError: false,
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
