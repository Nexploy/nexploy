import { Position } from '@xyflow/react';
import { removeDomainConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { RemoveDomainConfig } from '../config/RemoveDomainConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { GlobeOff } from 'lucide-react';

export const removeDomainManifest: NodeManifest = {
    type: 'remove-domain',
    definition: {
        id: 'remove-domain',
        type: 'base-node',
        category: 'deploy',
        metadata: {
            name: 'remove-domain.name',
            description: 'remove-domain.description',
            icon: GlobeOff,
            color: `${CATEGORY_BG_MUTED['deploy']} ${CATEGORY_TEXT['deploy']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: removeDomainConfigSchema,
    configPanel: RemoveDomainConfig,
    inputFields: [
        {
            key: 'host',
            labelKey: 'pipeline.inputs.host',
            descriptionKey: 'pipeline.inputs.desc_host',
            type: 'input',
        },
        {
            key: 'removed',
            labelKey: 'pipeline.inputs.domainRemoved',
            descriptionKey: 'pipeline.inputs.desc_domainRemoved',
            type: 'input',
        },
    ],
};
