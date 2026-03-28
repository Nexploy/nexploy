import { deployContainerConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { deployContainerNodeDef } from '../definitions/deploy-container.node';
import { DeployContainerConfig } from '../config/DeployContainerConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const deployContainerManifest: NodeManifest = {
    type: 'deploy-container',
    definition: deployContainerNodeDef,
    configSchema: deployContainerConfigSchema,
    configPanel: DeployContainerConfig,
};
