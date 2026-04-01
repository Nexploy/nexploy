import { fetchSecretsConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { fetchSecretsNodeDef } from '../definitions/fetch-secrets.node';
import { FetchSecretsConfig } from '../config/FetchSecretsConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const fetchSecretsManifest: NodeManifest = {
    type: 'fetch-secrets',
    definition: fetchSecretsNodeDef,
    configSchema: fetchSecretsConfigSchema,
    configPanel: FetchSecretsConfig,
};
