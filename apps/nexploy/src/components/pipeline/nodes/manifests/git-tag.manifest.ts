import { Position } from '@xyflow/react';
import { gitTagConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { GitTagConfig } from '../config/GitTagConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Milestone } from 'lucide-react';

export const gitTagManifest: NodeManifest = {
    type: 'git-tag',
    definition: {
        id: 'git-tag',
        type: 'base-node',
        category: 'source',
        metadata: {
            name: 'git-tag.name',
            description: 'git-tag.description',
            icon: Milestone,
            color: `${CATEGORY_BG_MUTED['source']} ${CATEGORY_TEXT['source']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: gitTagConfigSchema,
    configPanel: GitTagConfig,
    inputFields: [
        { key: 'tagName', labelKey: 'pipeline.inputs.tagName', type: 'string' },
        { key: 'remote', labelKey: 'pipeline.inputs.remote', type: 'string' },
    ],
};
