import { containerActionConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { restartContainerNodeDef } from '../definitions/restart-container.node';
import { RestartContainerConfig } from '../config/RestartContainerConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const restartContainerManifest: NodeManifest = {
    type: 'restart-container',
    definition: restartContainerNodeDef,
    configSchema: containerActionConfigSchema,
    configPanel: RestartContainerConfig,
};
