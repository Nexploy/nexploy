import { updateCommitStatusConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { UpdateCommitStatusConfig } from '../config/UpdateCommitStatusConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';
import { GitCommit } from 'lucide-react';

export const updateCommitStatusManifest: NodeManifest = {
    type: 'update-commit-status',
    definition: {
        id: 'update-commit-status',
        type: 'base-node',
        category: 'integration',
        metadata: {
            name: 'update-commit-status.name',
            description: 'update-commit-status.description',
            icon: GitCommit,
            color: `${CATEGORY_BG_MUTED['integration']} ${CATEGORY_TEXT['integration']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: updateCommitStatusConfigSchema,
    configPanel: UpdateCommitStatusConfig,
    inputFields: [
        {
            key: 'state',
            labelKey: 'pipeline.inputs.state',
            descriptionKey: 'pipeline.inputs.desc_state',
            type: 'input',
        },
        {
            key: 'context',
            labelKey: 'pipeline.inputs.context',
            descriptionKey: 'pipeline.inputs.desc_context',
            type: 'input',
        },
        {
            key: 'description',
            labelKey: 'pipeline.inputs.description',
            descriptionKey: 'pipeline.inputs.desc_description',
            type: 'input',
        },
    ],
};
