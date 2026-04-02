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
        category: 'utility',
        metadata: {
            name: 'pipeline.nodes.run-script.name',
            description: 'pipeline.nodes.run-script.description',
            icon: Terminal,
            color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
        },
        defaultConfig: {
            script: '',
            shell: 'bash',
            continueOnError: false,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: runScriptConfigSchema,
    configPanel: RunScriptConfig,
};
