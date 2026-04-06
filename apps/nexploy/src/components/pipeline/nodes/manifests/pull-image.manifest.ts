import { Position } from '@xyflow/react';
import { pullImageConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { PullImageConfig } from '../config/PullImageConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Download } from 'lucide-react';

export const pullImageManifest: NodeManifest = {
    type: 'pull-image',
    definition: {
        id: 'pull-image',
        type: 'base-node',
        category: 'build',
        metadata: {
            name: 'pull-image.name',
            description: 'pull-image.description',
            icon: Download,
            color: `${CATEGORY_BG_MUTED['build']} ${CATEGORY_TEXT['build']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: pullImageConfigSchema,
    configPanel: PullImageConfig,
};
