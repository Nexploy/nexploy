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
        category: 'utility',
        metadata: {
            name: 'pipeline.nodes.download-file.name',
            description: 'pipeline.nodes.download-file.description',
            icon: Download,
            color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
        },
        defaultConfig: {
            url: '',
            destinationPath: '',
            filename: '',
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
