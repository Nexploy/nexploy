import { Position } from '@xyflow/react';
import { cloneRepositoryConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { CloneRepositoryConfig } from '../config/CloneRepositoryConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { GitBranch } from 'lucide-react';

export const cloneRepositoryManifest: NodeManifest = {
    type: 'clone-repository',
    definition: {
        id: 'clone-repository',
        type: 'base-node',
        category: 'source',
        isStartNode: true,
        metadata: {
            name: 'pipeline.nodes.clone-repository.name',
            description: 'pipeline.nodes.clone-repository.description',
            icon: GitBranch,
            color: `${CATEGORY_BG_MUTED['source']} ${CATEGORY_TEXT['source']}`,
        },
        handles: {
            inputs: [],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: cloneRepositoryConfigSchema,
    configPanel: CloneRepositoryConfig,
};
