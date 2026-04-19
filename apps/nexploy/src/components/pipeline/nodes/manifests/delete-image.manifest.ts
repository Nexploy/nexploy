import { Position } from '@xyflow/react';
import { deleteImageConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { DeleteImageConfig } from '../config/DeleteImageConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Trash2 } from 'lucide-react';

export const deleteImageManifest: NodeManifest = {
    type: 'delete-image',
    definition: {
        id: 'delete-image',
        type: 'base-node',
        category: 'build',
        metadata: {
            name: 'delete-image.name',
            description: 'delete-image.description',
            icon: Trash2,
            color: `${CATEGORY_BG_MUTED['build']} ${CATEGORY_TEXT['build']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: deleteImageConfigSchema,
    configPanel: DeleteImageConfig,
    inputFields: [
        {
            key: 'imageName',
            labelKey: 'pipeline.inputs.imageName',
            descriptionKey: 'pipeline.inputs.desc_imageName',
            type: 'input',
        },
    ],
};
