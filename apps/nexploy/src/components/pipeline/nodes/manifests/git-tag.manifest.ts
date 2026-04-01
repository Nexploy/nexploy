import { gitTagConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { gitTagNodeDef } from '../definitions/git-tag.node';
import { GitTagConfig } from '../config/GitTagConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const gitTagManifest: NodeManifest = {
    type: 'git-tag',
    definition: gitTagNodeDef,
    configSchema: gitTagConfigSchema,
    configPanel: GitTagConfig,
};
