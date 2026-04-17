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
            name: 'deploy-stack.name',
            description: 'deploy-stack.description',
            icon: Layers,
            color: `${CATEGORY_BG_MUTED['deploy']} ${CATEGORY_TEXT['deploy']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: deployStackConfigSchema,
    configPanel: DeployStackConfig,
    inputFields: [
        { key: 'stackName', labelKey: 'pipeline.inputs.stackName', descriptionKey: 'pipeline.inputs.desc_stackName', type: 'input' },
        { key: 'services', labelKey: 'pipeline.inputs.services', descriptionKey: 'pipeline.inputs.desc_services', type: 'input' },
        { key: 'created', labelKey: 'pipeline.inputs.created', descriptionKey: 'pipeline.inputs.desc_created', type: 'input' },
        { key: 'updated', labelKey: 'pipeline.inputs.updated', descriptionKey: 'pipeline.inputs.desc_updated', type: 'input' },
    ],
};