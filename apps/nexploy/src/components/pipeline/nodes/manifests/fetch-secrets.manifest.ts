import { Position } from '@xyflow/react';
import { fetchSecretsConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { FetchSecretsConfig } from '../config/FetchSecretsConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { KeyRound } from 'lucide-react';

export const fetchSecretsManifest: NodeManifest = {
    type: 'fetch-secrets',
    definition: {
        id: 'fetch-secrets',
        type: 'base-node',
        category: 'config',
        metadata: {
            name: 'fetch-secrets.name',
            description: 'fetch-secrets.description',
            icon: KeyRound,
            color: `${CATEGORY_BG_MUTED['config']} ${CATEGORY_TEXT['config']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: fetchSecretsConfigSchema,
    configPanel: FetchSecretsConfig,
};
