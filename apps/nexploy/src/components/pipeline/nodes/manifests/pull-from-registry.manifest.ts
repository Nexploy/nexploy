import { Position } from '@xyflow/react';
import { pullFromRegistryConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { PullFromRegistryConfig } from '../config/PullFromRegistryConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Download } from 'lucide-react';

export const pullFromRegistryManifest: NodeManifest = {
    type: 'pull-from-registry',
    definition: {
        id: 'pull-from-registry',
        type: 'base-node',
        category: 'build',
        metadata: {
            name: 'pull-from-registry.name',
            description: 'pull-from-registry.description',
            icon: Download,
            color: `${CATEGORY_BG_MUTED['build']} ${CATEGORY_TEXT['build']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: pullFromRegistryConfigSchema,
    configPanel: PullFromRegistryConfig,
    inputFields: [
        { key: 'imageName', labelKey: 'pipeline.inputs.imageName', type: 'string' },
    ],
};
