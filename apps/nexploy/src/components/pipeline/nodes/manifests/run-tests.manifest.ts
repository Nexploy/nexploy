import { runTestsConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { RunTestsConfig } from '../config/RunTestsConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';

export const runTestsManifest: NodeManifest = {
    type: 'run-tests',
    definition: {
        id: 'run-tests',
        type: 'base-node',
        category: 'utility',
        metadata: {
            name: 'pipeline.nodes.run-tests.name',
            description: 'pipeline.nodes.run-tests.description',
            icon: 'FlaskConical',
            color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
        },
        defaultConfig: {
            command: '',
            image: 'node:20-alpine',
            workdir: '/workspace',
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: runTestsConfigSchema,
    configPanel: RunTestsConfig,
};
