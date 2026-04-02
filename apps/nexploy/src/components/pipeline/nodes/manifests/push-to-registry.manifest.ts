import { Position } from '@xyflow/react';
import { pushToRegistryConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { PushToRegistryConfig } from '../config/PushToRegistryConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Upload } from 'lucide-react';

export const pushToRegistryManifest: NodeManifest = {
    type: 'push-to-registry',
    definition: {
        id: 'push-to-registry',
        type: 'base-node',
        category: 'build',
        metadata: {
            name: 'pipeline.nodes.push-to-registry.name',
            description: 'pipeline.nodes.push-to-registry.description',
            icon: Upload,
            color: `${CATEGORY_BG_MUTED['build']} ${CATEGORY_TEXT['build']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: pushToRegistryConfigSchema,
    configPanel: PushToRegistryConfig,
};
