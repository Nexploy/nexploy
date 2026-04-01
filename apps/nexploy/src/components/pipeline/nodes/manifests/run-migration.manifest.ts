import { runMigrationConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { runMigrationNodeDef } from '../definitions/run-migration.node';
import { RunMigrationConfig } from '../config/RunMigrationConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const runMigrationManifest: NodeManifest = {
    type: 'run-migration',
    definition: runMigrationNodeDef,
    configSchema: runMigrationConfigSchema,
    configPanel: RunMigrationConfig,
};
