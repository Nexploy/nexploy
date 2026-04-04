import { Position } from '@xyflow/react';
import { backupDatabaseConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { BackupDatabaseConfig } from '../config/BackupDatabaseConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { HardDrive } from 'lucide-react';

export const backupDatabaseManifest: NodeManifest = {
    type: 'backup-database',
    definition: {
        id: 'backup-database',
        type: 'base-node',
        category: 'utility',
        metadata: {
            name: 'pipeline.nodes.backup-database.name',
            description: 'pipeline.nodes.backup-database.description',
            icon: HardDrive,
            color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: backupDatabaseConfigSchema,
    configPanel: BackupDatabaseConfig,
};
