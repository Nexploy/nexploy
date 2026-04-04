import { Position } from '@xyflow/react';
import { ConditionConfig } from '../config/ConditionConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Split } from 'lucide-react';
import { conditionConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const conditionManifest: NodeManifest = {
    type: 'condition',
    definition: {
        id: 'condition',
        type: 'base-node',
        category: 'utility',
        metadata: {
            name: 'pipeline.nodes.condition.name',
            description: 'pipeline.nodes.condition.description',
            icon: Split,
            color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [
                { id: 'true', position: Position.Right, labelKey: 'nodes.condition.outputTrue' },
                { id: 'false', position: Position.Right, labelKey: 'nodes.condition.outputFalse' },
            ],
            attachments: [],
        },
    },
    configSchema: conditionConfigSchema,
    configPanel: ConditionConfig,
};
