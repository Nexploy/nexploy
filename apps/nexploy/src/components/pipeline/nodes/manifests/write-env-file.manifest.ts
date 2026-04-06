import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';
import { FileKey } from 'lucide-react';

export const writeEnvFileManifest: NodeManifest = {
    type: 'write-env-file',
    definition: {
        id: 'write-env-file',
        type: 'base-node',
        category: 'config',
        metadata: {
            name: 'write-env-file.name',
            description: 'write-env-file.description',
            icon: FileKey,
            color: `${CATEGORY_BG_MUTED['config']} ${CATEGORY_TEXT['config']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
};
