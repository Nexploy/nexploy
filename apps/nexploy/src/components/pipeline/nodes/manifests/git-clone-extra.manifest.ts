import { gitCloneExtraConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { gitCloneExtraNodeDef } from '../definitions/git-clone-extra.node';
import { GitCloneExtraConfig } from '../config/GitCloneExtraConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const gitCloneExtraManifest: NodeManifest = {
    type: 'git-clone-extra',
    definition: gitCloneExtraNodeDef,
    configSchema: gitCloneExtraConfigSchema,
    configPanel: GitCloneExtraConfig,
};
