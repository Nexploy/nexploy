import { deployStackConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { deployStackNodeDef } from '../definitions/deploy-stack.node';
import { DeployStackConfig } from '../config/DeployStackConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const deployStackManifest: NodeManifest = {
    type: 'deploy-stack',
    definition: deployStackNodeDef,
    configSchema: deployStackConfigSchema,
    configPanel: DeployStackConfig,
};
