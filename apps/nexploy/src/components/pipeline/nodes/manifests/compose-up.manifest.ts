import { Position } from '@xyflow/react';
import { composeUpConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ComposeUpConfig } from '../config/ComposeUpConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Rocket } from 'lucide-react';

export const composeUpManifest: NodeManifest = {
    type: 'compose-up',
    definition: {
        id: 'compose-up',
        type: 'large-node',
        category: 'deploy',
        metadata: {
            name: 'compose-up.name',
            description: 'compose-up.description',
            icon: Rocket,
            color: `${CATEGORY_BG_MUTED['deploy']} ${CATEGORY_TEXT['deploy']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [{ id: 'save-version', position: Position.Bottom }],
        },
    },
    configSchema: composeUpConfigSchema,
    configPanel: ComposeUpConfig,
    inputFields: [
        {
            key: 'projectName',
            labelKey: 'pipeline.inputs.projectName',
            descriptionKey: 'pipeline.inputs.desc_projectName',
            type: 'input',
        },
    ],
};
