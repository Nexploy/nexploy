import { writeEnvFileConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { writeEnvFileNodeDef } from '../definitions/write-env-file.node';
import { WriteEnvFileConfig } from '../config/WriteEnvFileConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const writeEnvFileManifest: NodeManifest = {
    type: 'write-env-file',
    definition: writeEnvFileNodeDef,
    configSchema: writeEnvFileConfigSchema,
    configPanel: WriteEnvFileConfig,
};
