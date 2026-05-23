import { Position } from '@xyflow/react';
import { addDomainConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { AddDomainConfig } from '../config/AddDomainConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Globe } from 'lucide-react';

export const addDomainManifest: NodeManifest = {
    type: 'add-domain',
    definition: {
        id: 'add-domain',
        type: 'base-node',
        category: 'deploy',
        metadata: {
            name: 'add-domain.name',
            description: 'add-domain.description',
            icon: Globe,
            color: `${CATEGORY_BG_MUTED['deploy']} ${CATEGORY_TEXT['deploy']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: addDomainConfigSchema,
    configPanel: AddDomainConfig,
};
