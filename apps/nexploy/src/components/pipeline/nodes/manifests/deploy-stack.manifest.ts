import { Position } from '@xyflow/react';
import { deployStackConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { DeployStackConfig } from '../config/DeployStackConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Layers } from 'lucide-react';

export const deployStackManifest: NodeManifest = {
    type: 'deploy-stack',
    definition: {
        id: 'deploy-stack',
        type: 'base-node',
        category: 'deploy',
        metadata: {
            name: 'pipeline.nodes.deploy-stack.name',
            description: 'pipeline.nodes.deploy-stack.description',
            icon: Layers,
            color: `${CATEGORY_BG_MUTED['deploy']} ${CATEGORY_TEXT['deploy']}`,
        },
        defaultConfig: {
            stackName: '',
            composeFilePath: 'docker-compose.yml',
            prune: false,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: deployStackConfigSchema,
    configPanel: DeployStackConfig,
};
