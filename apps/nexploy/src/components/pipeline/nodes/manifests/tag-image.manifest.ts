import { tagImageConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { TagImageConfig } from '../config/TagImageConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';

export const tagImageManifest: NodeManifest = {
    type: 'tag-image',
    definition: {
        id: 'tag-image',
        type: 'base-node',
        category: 'build',
        metadata: {
            name: 'pipeline.nodes.tag-image.name',
            description: 'pipeline.nodes.tag-image.description',
            icon: 'Tag',
            color: `${CATEGORY_BG_MUTED['build']} ${CATEGORY_TEXT['build']}`,
        },
        defaultConfig: {
            sourceImage: '',
            sourceTag: 'latest',
            targetTag: '',
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: tagImageConfigSchema,
    configPanel: TagImageConfig,
};
