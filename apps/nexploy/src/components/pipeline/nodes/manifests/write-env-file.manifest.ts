import { writeEnvFileConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { WriteEnvFileConfig } from '../config/WriteEnvFileConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';

export const writeEnvFileManifest: NodeManifest = {
    type: 'write-env-file',
    definition: {
        id: 'write-env-file',
        type: 'base-node',
        category: 'utility',
        metadata: {
            name: 'pipeline.nodes.write-env-file.name',
            description: 'pipeline.nodes.write-env-file.description',
            icon: 'FileKey',
            color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: writeEnvFileConfigSchema,
    configPanel: WriteEnvFileConfig,
};
