import { buildDockerImageConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { buildDockerImageNodeDef } from '../definitions/build-docker-image.node';
import { BuildDockerImageConfig } from '../config/BuildDockerImageConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const buildDockerImageManifest: NodeManifest = {
    type: 'build-docker-image',
    definition: buildDockerImageNodeDef,
    configSchema: buildDockerImageConfigSchema,
    configPanel: BuildDockerImageConfig,
};
