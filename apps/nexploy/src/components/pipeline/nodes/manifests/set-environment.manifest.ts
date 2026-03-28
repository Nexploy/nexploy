import { setEnvironmentConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { setEnvironmentNodeDef } from '../definitions/set-environment.node';
import { SetEnvironmentConfig } from '../config/SetEnvironmentConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const setEnvironmentManifest: NodeManifest = {
    type: 'set-environment',
    definition: setEnvironmentNodeDef,
    configSchema: setEnvironmentConfigSchema,
    configPanel: SetEnvironmentConfig,
};
