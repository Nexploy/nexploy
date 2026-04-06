import { composeFileConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ValidateComposeConfig } from '../config/ValidateComposeConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';
import { FileSearch } from 'lucide-react';

export const validateComposeManifest: NodeManifest = {
    type: 'validate-compose',
    definition: {
        id: 'validate-compose',
        type: 'base-node',
        category: 'build',
        metadata: {
            name: 'validate-compose.name',
            description: 'validate-compose.description',
            icon: FileSearch,
            color: `${CATEGORY_BG_MUTED['build']} ${CATEGORY_TEXT['build']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: composeFileConfigSchema,
    configPanel: ValidateComposeConfig,
};
