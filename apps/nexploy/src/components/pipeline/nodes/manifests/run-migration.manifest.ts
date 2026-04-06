import { runMigrationConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { RunMigrationConfig } from '../config/RunMigrationConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { Position } from '@xyflow/react';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Database } from 'lucide-react';

export const runMigrationManifest: NodeManifest = {
    type: 'run-migration',
    definition: {
        id: 'run-migration',
        type: 'base-node',
        category: 'database',
        metadata: {
            name: 'run-migration.name',
            description: 'run-migration.description',
            icon: Database,
            color: `${CATEGORY_BG_MUTED['database']} ${CATEGORY_TEXT['database']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: runMigrationConfigSchema,
    configPanel: RunMigrationConfig,
};
