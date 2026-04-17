import { validateDockerfileConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ValidateDockerfileConfig } from '../config/ValidateDockerfileConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';
import { FileCheck } from 'lucide-react';

export const validateDockerfileManifest: NodeManifest = {
    type: 'validate-dockerfile',
    definition: {
        id: 'validate-dockerfile',
        type: 'base-node',
        category: 'build',
        metadata: {
            name: 'validate-dockerfile.name',
            description: 'validate-dockerfile.description',
            icon: FileCheck,
            color: `${CATEGORY_BG_MUTED['build']} ${CATEGORY_TEXT['build']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: validateDockerfileConfigSchema,
    configPanel: ValidateDockerfileConfig,
    inputFields: [
        { key: 'workDir', labelKey: 'pipeline.inputs.workDir', descriptionKey: 'pipeline.inputs.desc_workDir', type: 'input' },
        { key: 'dockerfilePath', labelKey: 'pipeline.inputs.dockerfilePath', descriptionKey: 'pipeline.inputs.desc_dockerfilePath', type: 'input' },
    ],
};