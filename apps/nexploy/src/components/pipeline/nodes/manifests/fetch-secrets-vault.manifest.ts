import { Position } from '@xyflow/react';
import { fetchSecretsVaultConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { FetchSecretsVaultConfig } from '../config/FetchSecretsVaultConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { KeyRound } from 'lucide-react';

export const fetchSecretsVaultManifest: NodeManifest = {
    type: 'fetch-secrets-vault',
    definition: {
        id: 'fetch-secrets-vault',
        type: 'base-node',
        category: 'config',
        metadata: {
            name: 'fetch-secrets-vault.name',
            description: 'fetch-secrets-vault.description',
            icon: KeyRound,
            color: `${CATEGORY_BG_MUTED['config']} ${CATEGORY_TEXT['config']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: fetchSecretsVaultConfigSchema,
    configPanel: FetchSecretsVaultConfig,
    inputFields: [
        {
            key: 'envVariables',
            labelKey: 'pipeline.inputs.envVariables',
            descriptionKey: 'pipeline.inputs.desc_envVariables',
            type: 'array',
        },
    ],
};
