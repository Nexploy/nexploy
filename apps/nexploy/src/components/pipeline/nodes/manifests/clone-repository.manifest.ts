import { cloneRepositoryConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { cloneRepositoryNodeDef } from '../definitions/clone-repository.node';
import { CloneRepositoryConfig } from '../config/CloneRepositoryConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const cloneRepositoryManifest: NodeManifest = {
    type: 'clone-repository',
    definition: cloneRepositoryNodeDef,
    configSchema: cloneRepositoryConfigSchema,
    configPanel: CloneRepositoryConfig,
};
