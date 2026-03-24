import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { WriteEnvFileConfig } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const writeEnvFileNodeDef: NodeDefinition<WriteEnvFileConfig> = {
    id: 'write-env-file',
    type: 'base-node',
    category: 'utility',
    metadata: {
        name: 'pipeline.nodes.write-env-file.name',
        description: 'pipeline.nodes.write-env-file.description',
        icon: 'FileKey',
        color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
    },
    handles: {
        inputs: [{ id: 'input', position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
        attachments: [],
    },
};
