import { runCommandInContainerConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { runCommandInContainerNodeDef } from '../definitions/run-command-in-container.node';
import { RunCommandInContainerConfig } from '../config/RunCommandInContainerConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const runCommandInContainerManifest: NodeManifest = {
    type: 'run-command-in-container',
    definition: runCommandInContainerNodeDef,
    configSchema: runCommandInContainerConfigSchema,
    configPanel: RunCommandInContainerConfig,
};
