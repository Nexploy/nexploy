import { Position } from '@xyflow/react';
import { composeFileConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { DeployComposeConfig } from '../config/DeployComposeConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const deployComposeManifest: NodeManifest = {
    type: 'deploy-compose',
    definition: {
        id: 'deploy-compose',
        type: 'large-node',
        category: 'deploy',
        metadata: {
            name: 'pipeline.nodes.deploy-compose.name',
            description: 'pipeline.nodes.deploy-compose.description',
            icon: 'Layers',
            color: `${CATEGORY_BG_MUTED['deploy']} ${CATEGORY_TEXT['deploy']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [{ id: 'save-version', position: Position.Bottom }],
        },
    },
    configSchema: composeFileConfigSchema,
    configPanel: DeployComposeConfig,
};
