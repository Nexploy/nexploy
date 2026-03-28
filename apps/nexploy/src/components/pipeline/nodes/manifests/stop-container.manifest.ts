import { containerActionConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { stopContainerNodeDef } from '../definitions/stop-container.node';
import { StopContainerConfig } from '../config/StopContainerConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const stopContainerManifest: NodeManifest = {
    type: 'stop-container',
    definition: stopContainerNodeDef,
    configSchema: containerActionConfigSchema,
    configPanel: StopContainerConfig,
};
