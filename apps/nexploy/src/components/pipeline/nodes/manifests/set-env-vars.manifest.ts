import { setEnvVarsConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { SetEnvVarsConfig } from '../config/SetEnvVarsConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { Position } from '@xyflow/react';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Variable } from 'lucide-react';

export const setEnvVarsManifest: NodeManifest = {
    type: 'set-env-vars',
    definition: {
        id: 'set-env-vars',
        type: 'base-node',
        category: 'config',
        metadata: {
            name: 'set-env-vars.name',
            description: 'set-env-vars.description',
            icon: Variable,
            color: `${CATEGORY_BG_MUTED['config']} ${CATEGORY_TEXT['config']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: setEnvVarsConfigSchema,
    configPanel: SetEnvVarsConfig,
    inputFields: [
        {
            key: 'envVariables',
            labelKey: 'pipeline.inputs.envVariables',
            descriptionKey: 'pipeline.inputs.desc_envVariables',
            type: 'array',
        },
    ],
};
