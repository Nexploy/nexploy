import { Position } from '@xyflow/react';
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
            name: 'clean-workdir.name',
            description: 'clean-workdir.description',
            icon: Trash2,
            color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    inputFields: [
        { key: 'cleaned', labelKey: 'pipeline.inputs.cleaned', descriptionKey: 'pipeline.inputs.desc_cleaned', type: 'input' },
    ],
};