import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const backupDatabaseNodeDef: NodeDefinition = {
    id: 'backup-database',
    type: 'base-node',
    category: 'utility',
    metadata: {
        name: 'pipeline.nodes.backup-database.name',
        description: 'pipeline.nodes.backup-database.description',
        icon: 'HardDrive',
        color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
    },
    defaultConfig: {
        dbType: 'postgres',
        host: '',
        port: 5432,
        database: '',
        username: '',
        password: '',
        outputPath: '',
    },
    handles: {
        inputs: [{ id: 'input', position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
        attachments: [],
    },
};
