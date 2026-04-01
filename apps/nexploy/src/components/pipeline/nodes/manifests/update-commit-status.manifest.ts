import { updateCommitStatusConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { updateCommitStatusNodeDef } from '../definitions/update-commit-status.node';
import { UpdateCommitStatusConfig } from '../config/UpdateCommitStatusConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const updateCommitStatusManifest: NodeManifest = {
    type: 'update-commit-status',
    definition: updateCommitStatusNodeDef,
    configSchema: updateCommitStatusConfigSchema,
    configPanel: UpdateCommitStatusConfig,
};
