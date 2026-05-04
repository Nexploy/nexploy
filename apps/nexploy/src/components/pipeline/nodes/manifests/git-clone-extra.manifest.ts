import { Position } from '@xyflow/react';
import { gitCloneExtraConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { GitCloneExtraConfig } from '../config/GitCloneExtraConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { GitFork } from 'lucide-react';

export const gitCloneExtraManifest: NodeManifest = {
    type: 'git-clone-extra',
    definition: {
        id: 'git-clone-extra',
        type: 'base-node',
        category: 'source',
        metadata: {
            name: 'git-clone-extra.name',
            description: 'git-clone-extra.description',
            icon: GitFork,
            color: `${CATEGORY_BG_MUTED['source']} ${CATEGORY_TEXT['source']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: gitCloneExtraConfigSchema,
    configPanel: GitCloneExtraConfig,
    inputFields: [
        {
            key: 'repoUrl',
            labelKey: 'pipeline.inputs.repoUrl',
            descriptionKey: 'pipeline.inputs.desc_repoUrl',
            type: 'input',
        },
        {
            key: 'branch',
            labelKey: 'pipeline.inputs.branch',
            descriptionKey: 'pipeline.inputs.desc_branch',
            type: 'input',
        },
        {
            key: 'targetDir',
            labelKey: 'pipeline.inputs.targetDir',
            descriptionKey: 'pipeline.inputs.desc_targetDir',
            type: 'input',
        },
    ],
};
