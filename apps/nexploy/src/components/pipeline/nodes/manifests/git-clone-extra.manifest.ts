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
            name: 'pipeline.nodes.git-clone-extra.name',
            description: 'pipeline.nodes.git-clone-extra.description',
            icon: GitFork,
            color: `${CATEGORY_BG_MUTED['source']} ${CATEGORY_TEXT['source']}`,
        },
        defaultConfig: {
            repoUrl: '',
            branch: 'main',
            targetDir: '',
            token: '',
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: gitCloneExtraConfigSchema,
    configPanel: GitCloneExtraConfig,
};
