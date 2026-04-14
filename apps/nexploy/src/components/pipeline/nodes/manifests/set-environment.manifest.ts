import { setEnvironmentConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { SetEnvironmentConfig } from '../config/SetEnvironmentConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';
import { Server } from 'lucide-react';

export const setEnvironmentManifest: NodeManifest = {
    type: 'set-environment',
    definition: {
        id: 'set-environment',
        type: 'base-node',
        category: 'deploy',
        metadata: {
            name: 'set-environment.name',
            description: 'set-environment.description',
            icon: Server,
            color: `${CATEGORY_BG_MUTED['deploy']} ${CATEGORY_TEXT['deploy']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: setEnvironmentConfigSchema,
    configPanel: SetEnvironmentConfig,
    inputFields: [
        { key: 'environmentId', labelKey: 'pipeline.inputs.environmentId', type: 'string' },
    ],
};
