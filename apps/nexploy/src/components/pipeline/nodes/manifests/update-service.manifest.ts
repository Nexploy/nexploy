import { updateServiceConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { UpdateServiceConfig } from '../config/UpdateServiceConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';
import { RefreshCw } from 'lucide-react';

export const updateServiceManifest: NodeManifest = {
    type: 'update-service',
    definition: {
        id: 'update-service',
        type: 'base-node',
        category: 'deploy',
        metadata: {
            name: 'update-service.name',
            description: 'update-service.description',
            icon: RefreshCw,
            color: `${CATEGORY_BG_MUTED['deploy']} ${CATEGORY_TEXT['deploy']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: updateServiceConfigSchema,
    configPanel: UpdateServiceConfig,
    inputFields: [
        { key: 'serviceName', labelKey: 'pipeline.inputs.serviceName', descriptionKey: 'pipeline.inputs.desc_serviceName', type: 'input' },
        { key: 'image', labelKey: 'pipeline.inputs.image', descriptionKey: 'pipeline.inputs.desc_image', type: 'input' },
        { key: 'tag', labelKey: 'pipeline.inputs.tag', descriptionKey: 'pipeline.inputs.desc_tag', type: 'input' },
        { key: 'fullImage', labelKey: 'pipeline.inputs.fullImage', descriptionKey: 'pipeline.inputs.desc_fullImage', type: 'input' },
    ],
};