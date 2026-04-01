import { waitForHealthConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { waitForHealthNodeDef } from '../definitions/wait-for-health.node';
import { WaitForHealthConfig } from '../config/WaitForHealthConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const waitForHealthManifest: NodeManifest = {
    type: 'wait-for-health',
    definition: waitForHealthNodeDef,
    configSchema: waitForHealthConfigSchema,
    configPanel: WaitForHealthConfig,
};
