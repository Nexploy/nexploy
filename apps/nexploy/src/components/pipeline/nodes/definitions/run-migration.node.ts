import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const runMigrationNodeDef: NodeDefinition = {
    id: 'run-migration',
    type: 'base-node',
    category: 'utility',
    metadata: {
        name: 'pipeline.nodes.run-migration.name',
        description: 'pipeline.nodes.run-migration.description',
        icon: 'Database',
        color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
    },
    defaultConfig: {
        image: '',
        command: '',
        databaseUrl: '',
        workdir: '',
    },
    handles: {
        inputs: [{ id: 'input', position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
        attachments: [],
    },
};
