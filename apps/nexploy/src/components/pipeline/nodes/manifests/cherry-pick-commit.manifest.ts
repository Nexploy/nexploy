import { Position } from '@xyflow/react';
import { cherryPickCommitConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { CherryPickCommitConfig } from '../config/CherryPickCommitConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { GitCommit } from 'lucide-react';

export const cherryPickCommitManifest: NodeManifest = {
    type: 'cherry-pick-commit',
    definition: {
        id: 'cherry-pick-commit',
        type: 'base-node',
        category: 'source',
        metadata: {
            name: 'cherry-pick-commit.name',
            description: 'cherry-pick-commit.description',
            icon: GitCommit,
            color: `${CATEGORY_BG_MUTED['source']} ${CATEGORY_TEXT['source']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: cherryPickCommitConfigSchema,
    configPanel: CherryPickCommitConfig,
    inputFields: [
        {
            key: 'workDir',
            labelKey: 'pipeline.inputs.workDir',
            descriptionKey: 'pipeline.inputs.desc_workDir',
            type: 'input',
        },
        {
            key: 'commitHash',
            labelKey: 'pipeline.inputs.commitHash',
            descriptionKey: 'pipeline.inputs.desc_commitHash',
            type: 'input',
        },
    ],
};
