import { Position } from '@xyflow/react';
import { runCommandInContainerConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { RunCommandInContainerConfig } from '../config/RunCommandInContainerConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { SquareTerminal } from 'lucide-react';

export const runCommandInContainerManifest: NodeManifest = {
    type: 'run-command-in-container',
    definition: {
        id: 'run-command-in-container',
        type: 'base-node',
        category: 'script',
        metadata: {
            name: 'run-command-in-container.name',
            description: 'run-command-in-container.description',
            icon: SquareTerminal,
            color: `${CATEGORY_BG_MUTED['script']} ${CATEGORY_TEXT['script']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: runCommandInContainerConfigSchema,
    configPanel: RunCommandInContainerConfig,
    inputFields: [
        { key: 'exitCode', labelKey: 'pipeline.inputs.exitCode', descriptionKey: 'pipeline.inputs.desc_exitCode', type: 'input' },
    ],
};