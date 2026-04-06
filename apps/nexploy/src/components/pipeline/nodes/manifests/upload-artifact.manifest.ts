import { uploadArtifactConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { UploadArtifactConfig } from '../config/UploadArtifactConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';
import { Upload } from 'lucide-react';

export const uploadArtifactManifest: NodeManifest = {
    type: 'upload-artifact',
    definition: {
        id: 'upload-artifact',
        type: 'base-node',
        category: 'files',
        metadata: {
            name: 'upload-artifact.name',
            description: 'upload-artifact.description',
            icon: Upload,
            color: `${CATEGORY_BG_MUTED['files']} ${CATEGORY_TEXT['files']}`,
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
