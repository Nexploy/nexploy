import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const cacheSaveNodeDef: NodeDefinition = {
    id: 'cache-save',
    type: 'base-node',
    category: 'utility',
    metadata: {
        name: 'pipeline.nodes.cache-save.name',
        description: 'pipeline.nodes.cache-save.description',
        icon: 'FolderOutput',
        color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
    },
    defaultConfig: {
        volumeName: '',
        sourcePath: '',
        cacheKey: '',
    },
    handles: {
        inputs: [{ id: 'input', position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
        attachments: [],
    },
};
