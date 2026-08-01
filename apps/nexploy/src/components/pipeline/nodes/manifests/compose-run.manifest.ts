import { Position } from '@xyflow/react';
import { composeRunConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ComposeRunConfig } from '../config/ComposeRunConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Terminal } from 'lucide-react';

export const composeRunManifest: NodeManifest = {
    type: 'compose-run',
    definition: {
        id: 'compose-run',
        type: 'base-node',
        category: 'script',
        metadata: {
            name: 'compose-run.name',
            description: 'compose-run.description',
            icon: Terminal,
            color: `${CATEGORY_BG_MUTED['script']} ${CATEGORY_TEXT['script']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: composeRunConfigSchema,
    configPanel: ComposeRunConfig,
    inputFields: [
        {
            key: 'exitCode',
            labelKey: 'pipeline.inputs.exitCode',
            descriptionKey: 'pipeline.inputs.desc_exitCode',
            type: 'input',
        },
    ],
};
