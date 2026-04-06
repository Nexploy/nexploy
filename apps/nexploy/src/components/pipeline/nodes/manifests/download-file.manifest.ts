import { Position } from '@xyflow/react';
import { downloadFileConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { DownloadFileConfig } from '../config/DownloadFileConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Download } from 'lucide-react';

export const downloadFileManifest: NodeManifest = {
    type: 'download-file',
    definition: {
        id: 'download-file',
        type: 'base-node',
        category: 'files',
        metadata: {
            name: 'download-file.name',
            description: 'download-file.description',
            icon: Download,
            color: `${CATEGORY_BG_MUTED['files']} ${CATEGORY_TEXT['files']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: downloadFileConfigSchema,
    configPanel: DownloadFileConfig,
};
