import { Position } from '@xyflow/react';
import { composeBuildConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ComposeBuildConfig } from '../config/ComposeBuildConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Hammer } from 'lucide-react';

export const composeBuildManifest: NodeManifest = {
    type: 'compose-build',
    definition: {
        id: 'compose-build',
        type: 'base-node',
        category: 'build',
        metadata: {
            name: 'compose-build.name',
            description: 'compose-build.description',
            icon: Hammer,
            color: `${CATEGORY_BG_MUTED['build']} ${CATEGORY_TEXT['build']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: composeBuildConfigSchema,
    configPanel: ComposeBuildConfig,
    inputFields: [
        {
            key: 'projectName',
            labelKey: 'pipeline.inputs.projectName',
            descriptionKey: 'pipeline.inputs.desc_projectName',
            type: 'input',
        },
        {
            key: 'composeFile',
            labelKey: 'pipeline.inputs.composeFile',
            descriptionKey: 'pipeline.inputs.desc_composeFile',
            type: 'input',
        },
    ],
};
