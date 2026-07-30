import { Position } from '@xyflow/react';
import { fetchSecretsInfisicalConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { FetchSecretsInfisicalConfig } from '../config/FetchSecretsInfisicalConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { KeySquare } from 'lucide-react';

export const fetchSecretsInfisicalManifest: NodeManifest = {
    type: 'fetch-secrets-infisical',
    definition: {
        id: 'fetch-secrets-infisical',
        type: 'base-node',
        category: 'config',
        metadata: {
            name: 'fetch-secrets-infisical.name',
            description: 'fetch-secrets-infisical.description',
            icon: KeySquare,
            color: `${CATEGORY_BG_MUTED['config']} ${CATEGORY_TEXT['config']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: fetchSecretsInfisicalConfigSchema,
    configPanel: FetchSecretsInfisicalConfig,
    inputFields: [
        {
            key: 'envVariables',
            labelKey: 'pipeline.inputs.envVariables',
            descriptionKey: 'pipeline.inputs.desc_envVariables',
            type: 'array',
        },
    ],
};
