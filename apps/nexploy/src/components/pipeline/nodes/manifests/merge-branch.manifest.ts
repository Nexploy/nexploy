import { Position } from '@xyflow/react';
import { mergeBranchConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { MergeBranchConfig } from '../config/MergeBranchConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { GitMerge } from 'lucide-react';

export const mergeBranchManifest: NodeManifest = {
    type: 'merge-branch',
    definition: {
        id: 'merge-branch',
        type: 'base-node',
        category: 'source',
        metadata: {
            name: 'merge-branch.name',
            description: 'merge-branch.description',
            icon: GitMerge,
            color: `${CATEGORY_BG_MUTED['source']} ${CATEGORY_TEXT['source']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: mergeBranchConfigSchema,
    configPanel: MergeBranchConfig,
    inputFields: [
        {
            key: 'workDir',
            labelKey: 'pipeline.inputs.workDir',
            descriptionKey: 'pipeline.inputs.desc_workDir',
            type: 'input',
        },
        {
            key: 'targetBranch',
            labelKey: 'pipeline.inputs.targetBranch',
            descriptionKey: 'pipeline.inputs.desc_targetBranch',
            type: 'input',
        },
        {
            key: 'sourceBranch',
            labelKey: 'pipeline.inputs.sourceBranch',
            descriptionKey: 'pipeline.inputs.desc_sourceBranch',
            type: 'input',
        },
    ],
};
