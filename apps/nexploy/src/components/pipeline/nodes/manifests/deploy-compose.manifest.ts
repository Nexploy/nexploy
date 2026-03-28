import { composeFileConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { deployComposeNodeDef } from '../definitions/deploy-compose.node';
import { DeployComposeConfig } from '../config/DeployComposeConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const deployComposeManifest: NodeManifest = {
    type: 'deploy-compose',
    definition: deployComposeNodeDef,
    configSchema: composeFileConfigSchema,
    configPanel: DeployComposeConfig,
};
