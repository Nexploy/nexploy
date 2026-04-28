import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';
import { FileKey } from 'lucide-react';
import { EnvVarsConfig } from '../config/EnvVarsConfig';

export const envVarsManifest: NodeManifest = {
    type: 'env-vars',
    definition: {
        id: 'env-vars',
        type: 'base-node',
        category: 'config',
        metadata: {
            name: 'env-vars.name',
            description: 'env-vars.description',
            icon: FileKey,
            color: `${CATEGORY_BG_MUTED['config']} ${CATEGORY_TEXT['config']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configPanel: EnvVarsConfig,
};
