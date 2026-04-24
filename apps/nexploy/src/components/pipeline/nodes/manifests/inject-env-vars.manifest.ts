import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';
import { FileKey } from 'lucide-react';
import { InjectEnvVarsConfig } from '../config/InjectEnvVarsConfig';

export const injectEnvVarsManifest: NodeManifest = {
    type: 'inject-env-vars',
    definition: {
        id: 'inject-env-vars',
        type: 'base-node',
        category: 'config',
        metadata: {
            name: 'inject-env-vars.name',
            description: 'inject-env-vars.description',
            icon: FileKey,
            color: `${CATEGORY_BG_MUTED['config']} ${CATEGORY_TEXT['config']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configPanel: InjectEnvVarsConfig,
};
