import { runScriptConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { RunScriptConfig } from '../config/RunScriptConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';
import { Terminal } from 'lucide-react';

export const runScriptManifest: NodeManifest = {
    type: 'run-script',
    definition: {
        id: 'run-script',
        type: 'base-node',
        category: 'script',
        metadata: {
            name: 'run-script.name',
            description: 'run-script.description',
            icon: Terminal,
            color: `${CATEGORY_BG_MUTED['script']} ${CATEGORY_TEXT['script']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: runScriptConfigSchema,
    configPanel: RunScriptConfig,
    inputFields: [
        { key: 'exitCode', labelKey: 'pipeline.inputs.exitCode', descriptionKey: 'pipeline.inputs.desc_exitCode', type: 'input' },
    ],
};
