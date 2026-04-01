import { runTestsConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { runTestsNodeDef } from '../definitions/run-tests.node';
import { RunTestsConfig } from '../config/RunTestsConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const runTestsManifest: NodeManifest = {
    type: 'run-tests',
    definition: runTestsNodeDef,
    configSchema: runTestsConfigSchema,
    configPanel: RunTestsConfig,
};
