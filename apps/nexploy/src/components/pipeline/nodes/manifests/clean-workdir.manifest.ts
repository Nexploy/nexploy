import { Position } from '@xyflow/react';
import { CleanWorkdirConfig } from '../config/CleanWorkdirConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Trash2 } from 'lucide-react';

export const cleanWorkdirManifest: NodeManifest = {
    type: 'clean-workdir',
    definition: {
        id: 'clean-workdir',
        type: 'base-node',
        category: 'utility',
        metadata: {
            name: 'pipeline.nodes.clean-workdir.name',
            description: 'pipeline.nodes.clean-workdir.description',
            icon: Trash2,
            color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configPanel: CleanWorkdirConfig,
};
