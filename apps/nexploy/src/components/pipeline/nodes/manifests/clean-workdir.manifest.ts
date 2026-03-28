import { cleanWorkdirConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { cleanWorkdirNodeDef } from '../definitions/clean-workdir.node';
import { CleanWorkdirConfig } from '../config/CleanWorkdirConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const cleanWorkdirManifest: NodeManifest = {
    type: 'clean-workdir',
    definition: cleanWorkdirNodeDef,
    configSchema: cleanWorkdirConfigSchema,
    configPanel: CleanWorkdirConfig,
};
