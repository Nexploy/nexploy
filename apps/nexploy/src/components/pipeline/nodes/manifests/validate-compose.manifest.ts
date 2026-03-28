import { composeFileConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { validateComposeNodeDef } from '../definitions/validate-compose.node';
import { ValidateComposeConfig } from '../config/ValidateComposeConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const validateComposeManifest: NodeManifest = {
    type: 'validate-compose',
    definition: validateComposeNodeDef,
    configSchema: composeFileConfigSchema,
    configPanel: ValidateComposeConfig,
};
