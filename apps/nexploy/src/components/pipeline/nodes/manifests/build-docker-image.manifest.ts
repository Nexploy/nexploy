import { Position } from '@xyflow/react';
import { buildDockerImageConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { BuildDockerImageConfig } from '../config/BuildDockerImageConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Container } from 'lucide-react';

export const buildDockerImageManifest: NodeManifest = {
    type: 'build-docker-image',
    definition: {
        id: 'build-docker-image',
        type: 'base-node',
        category: 'build',
        metadata: {
            name: 'build-docker-image.name',
            description: 'build-docker-image.description',
            icon: Container,
            color: `${CATEGORY_BG_MUTED['build']} ${CATEGORY_TEXT['build']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: buildDockerImageConfigSchema,
    configPanel: BuildDockerImageConfig,
};
