import { saveVersionConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { SaveVersionConfig } from '../config/SaveVersionConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { Position } from '@xyflow/react';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Tag } from 'lucide-react';

export const saveVersionManifest: NodeManifest = {
    type: 'save-version',
    definition: {
        id: 'save-version',
        type: 'attach-node',
        category: 'utility',
        metadata: {
            name: 'pipeline.nodes.save-version.name',
            description: 'pipeline.nodes.save-version.description',
            icon: Tag,
            color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Top, acceptsFrom: 'save-version' }],
            outputs: [],
            attachments: [],
        },
    },
    configSchema: saveVersionConfigSchema,
    configPanel: SaveVersionConfig,
};
