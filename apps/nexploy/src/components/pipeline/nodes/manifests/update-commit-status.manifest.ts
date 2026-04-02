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
        category: 'utility',
        metadata: {
            name: 'pipeline.nodes.update-commit-status.name',
            description: 'pipeline.nodes.update-commit-status.description',
            icon: GitCommit,
            color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
        },
        defaultConfig: {
            provider: 'github',
            token: '',
            owner: '',
            repo: '',
            sha: '',
            state: 'pending',
            description: '',
            targetUrl: '',
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: updateCommitStatusConfigSchema,
    configPanel: UpdateCommitStatusConfig,
};
