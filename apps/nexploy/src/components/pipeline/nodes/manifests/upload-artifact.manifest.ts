import { uploadArtifactConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { uploadArtifactNodeDef } from '../definitions/upload-artifact.node';
import { UploadArtifactConfig } from '../config/UploadArtifactConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const uploadArtifactManifest: NodeManifest = {
    type: 'upload-artifact',
    definition: uploadArtifactNodeDef,
    configSchema: uploadArtifactConfigSchema,
    configPanel: UploadArtifactConfig,
};
