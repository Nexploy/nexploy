import { Position } from '@xyflow/react';
import { fetchSecretsDopplerConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { FetchSecretsDopplerConfig } from '../config/FetchSecretsDopplerConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { KeyRound } from 'lucide-react';

export const fetchSecretsDopplerManifest: NodeManifest = {
    type: 'fetch-secrets-doppler',
    definition: {
        id: 'fetch-secrets-doppler',
        type: 'base-node',
        category: 'config',
        metadata: {
            name: 'fetch-secrets-doppler.name',
            description: 'fetch-secrets-doppler.description',
            icon: KeyRound,
            color: `${CATEGORY_BG_MUTED['config']} ${CATEGORY_TEXT['config']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: fetchSecretsDopplerConfigSchema,
    configPanel: FetchSecretsDopplerConfig,
    inputFields: [
        {
            key: 'envVariables',
            labelKey: 'pipeline.inputs.envVariables',
            descriptionKey: 'pipeline.inputs.desc_envVariables',
            type: 'array',
        },
    ],
};
