import { validateDockerfileConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { validateDockerfileNodeDef } from '../definitions/validate-dockerfile.node';
import { ValidateDockerfileConfig } from '../config/ValidateDockerfileConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const validateDockerfileManifest: NodeManifest = {
    type: 'validate-dockerfile',
    definition: validateDockerfileNodeDef,
    configSchema: validateDockerfileConfigSchema,
    configPanel: ValidateDockerfileConfig,
};
