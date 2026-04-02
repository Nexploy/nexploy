import { uploadArtifactConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { UploadArtifactConfig } from '../config/UploadArtifactConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';

export const uploadArtifactManifest: NodeManifest = {
    type: 'upload-artifact',
    definition: {
        id: 'upload-artifact',
        type: 'base-node',
        category: 'utility',
        metadata: {
            name: 'pipeline.nodes.upload-artifact.name',
            description: 'pipeline.nodes.upload-artifact.description',
            icon: 'Upload',
            color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
        },
        defaultConfig: {
            endpoint: '',
            bucket: '',
            accessKey: '',
            secretKey: '',
            sourcePath: '',
            destinationPath: '',
            useSSL: true,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: uploadArtifactConfigSchema,
    configPanel: UploadArtifactConfig,
};
