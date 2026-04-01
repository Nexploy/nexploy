import { checkContainerLogsConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { checkContainerLogsNodeDef } from '../definitions/check-container-logs.node';
import { CheckContainerLogsConfig } from '../config/CheckContainerLogsConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const checkContainerLogsManifest: NodeManifest = {
    type: 'check-container-logs',
    definition: checkContainerLogsNodeDef,
    configSchema: checkContainerLogsConfigSchema,
    configPanel: CheckContainerLogsConfig,
};
