import { runScriptConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { runScriptNodeDef } from '../definitions/run-script.node';
import { RunScriptConfig } from '../config/RunScriptConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const runScriptManifest: NodeManifest = {
    type: 'run-script',
    definition: runScriptNodeDef,
    configSchema: runScriptConfigSchema,
    configPanel: RunScriptConfig,
};
