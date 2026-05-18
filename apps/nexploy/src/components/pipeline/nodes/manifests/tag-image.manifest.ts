import { tagImageConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { TagImageConfig } from '../config/TagImageConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';
import { Tag } from 'lucide-react';

export const tagImageManifest: NodeManifest = {
    type: 'tag-image',
    definition: {
        id: 'tag-image',
        type: 'base-node',
        category: 'build',
        metadata: {
            name: 'tag-image.name',
            description: 'tag-image.description',
            icon: Tag,
            color: `${CATEGORY_BG_MUTED['build']} ${CATEGORY_TEXT['build']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: tagImageConfigSchema,
    configPanel: TagImageConfig,
    inputFields: [
        { key: 'sourceImage', labelKey: 'pipeline.inputs.sourceImage', descriptionKey: 'pipeline.inputs.desc_sourceImage', type: 'input' },
        { key: 'targetTag', labelKey: 'pipeline.inputs.targetTag', descriptionKey: 'pipeline.inputs.desc_targetTag', type: 'input' },
        { key: 'taggedImage', labelKey: 'pipeline.inputs.taggedImage', descriptionKey: 'pipeline.inputs.desc_taggedImage', type: 'input' },
    ],
};