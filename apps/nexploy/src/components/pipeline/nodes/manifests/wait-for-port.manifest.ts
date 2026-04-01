import { waitForPortConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { waitForPortNodeDef } from '../definitions/wait-for-port.node';
import { WaitForPortConfig } from '../config/WaitForPortConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const waitForPortManifest: NodeManifest = {
    type: 'wait-for-port',
    definition: waitForPortNodeDef,
    configSchema: waitForPortConfigSchema,
    configPanel: WaitForPortConfig,
};
