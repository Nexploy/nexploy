import { setEnvVarsConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { setEnvVarsNodeDef } from '../definitions/set-env-vars.node';
import { SetEnvVarsConfig } from '../config/SetEnvVarsConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const setEnvVarsManifest: NodeManifest = {
    type: 'set-env-vars',
    definition: setEnvVarsNodeDef,
    configSchema: setEnvVarsConfigSchema,
    configPanel: SetEnvVarsConfig,
};
