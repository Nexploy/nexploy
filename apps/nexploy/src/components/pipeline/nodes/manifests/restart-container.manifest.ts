import { Position } from '@xyflow/react';
import { containerActionConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { RestartContainerConfig } from '../config/RestartContainerConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { RotateCcw } from 'lucide-react';

export const restartContainerManifest: NodeManifest = {
    type: 'restart-container',
    definition: {
        id: 'restart-container',
        type: 'base-node',
        category: 'deploy',
        metadata: {
            name: 'pipeline.nodes.restart-container.name',
            description: 'pipeline.nodes.restart-container.description',
            icon: RotateCcw,
            color: `${CATEGORY_BG_MUTED['deploy']} ${CATEGORY_TEXT['deploy']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: containerActionConfigSchema,
    configPanel: RestartContainerConfig,
};
