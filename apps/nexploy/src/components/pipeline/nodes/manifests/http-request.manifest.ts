import { httpRequestConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { httpRequestNodeDef } from '../definitions/http-request.node';
import { HttpRequestConfig } from '../config/HttpRequestConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const httpRequestManifest: NodeManifest = {
    type: 'http-request',
    definition: httpRequestNodeDef,
    configSchema: httpRequestConfigSchema,
    configPanel: HttpRequestConfig,
};
