import { waitForUrlConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { waitForUrlNodeDef } from '../definitions/wait-for-url.node';
import { WaitForUrlConfig } from '../config/WaitForUrlConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const waitForUrlManifest: NodeManifest = {
    type: 'wait-for-url',
    definition: waitForUrlNodeDef,
    configSchema: waitForUrlConfigSchema,
    configPanel: WaitForUrlConfig,
};
