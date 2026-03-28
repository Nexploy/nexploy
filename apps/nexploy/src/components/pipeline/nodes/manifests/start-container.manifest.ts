import { containerActionConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { startContainerNodeDef } from '../definitions/start-container.node';
import { StartContainerConfig } from '../config/StartContainerConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const startContainerManifest: NodeManifest = {
    type: 'start-container',
    definition: startContainerNodeDef,
    configSchema: containerActionConfigSchema,
    configPanel: StartContainerConfig,
};
