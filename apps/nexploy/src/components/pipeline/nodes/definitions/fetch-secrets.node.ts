import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const fetchSecretsNodeDef: NodeDefinition = {
    id: 'fetch-secrets',
    type: 'base-node',
    category: 'utility',
    metadata: {
        name: 'pipeline.nodes.fetch-secrets.name',
        description: 'pipeline.nodes.fetch-secrets.description',
        icon: 'KeyRound',
        color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
    },
    defaultConfig: {
        provider: 'vault',
        endpoint: '',
        token: '',
        secretPath: '',
        outputAs: 'env-vars',
    },
    handles: {
        inputs: [{ id: 'input', position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
        attachments: [],
    },
};
