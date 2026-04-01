import { backupDatabaseConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { backupDatabaseNodeDef } from '../definitions/backup-database.node';
import { BackupDatabaseConfig } from '../config/BackupDatabaseConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const backupDatabaseManifest: NodeManifest = {
    type: 'backup-database',
    definition: backupDatabaseNodeDef,
    configSchema: backupDatabaseConfigSchema,
    configPanel: BackupDatabaseConfig,
};
