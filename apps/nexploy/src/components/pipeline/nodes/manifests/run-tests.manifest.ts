import { runTestsConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { RunTestsConfig } from '../config/RunTestsConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';
import { FlaskConical } from 'lucide-react';

export const runTestsManifest: NodeManifest = {
    type: 'run-tests',
    definition: {
        id: 'run-tests',
        type: 'base-node',
        category: 'script',
        metadata: {
            name: 'run-tests.name',
            description: 'run-tests.description',
            icon: FlaskConical,
            color: `${CATEGORY_BG_MUTED['script']} ${CATEGORY_TEXT['script']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: runTestsConfigSchema,
    configPanel: RunTestsConfig,
    inputFields: [
        { key: 'exitCode', labelKey: 'pipeline.inputs.exitCode', descriptionKey: 'pipeline.inputs.desc_exitCode', type: 'input' },
        { key: 'testsPassed', labelKey: 'pipeline.inputs.testsPassed', descriptionKey: 'pipeline.inputs.desc_testsPassed', type: 'input' },
    ],
};