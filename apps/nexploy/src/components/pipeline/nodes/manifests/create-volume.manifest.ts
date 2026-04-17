import { Position } from '@xyflow/react';
import { createVolumeConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { CreateVolumeConfig } from '../config/CreateVolumeConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { HardDrive } from 'lucide-react';

export const createVolumeManifest: NodeManifest = {
    type: 'create-volume',
    definition: {
        id: 'create-volume',
        type: 'base-node',
        category: 'utility',
        metadata: {
            name: 'create-volume.name',
            description: 'create-volume.description',
            icon: HardDrive,
            color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: createVolumeConfigSchema,
    configPanel: CreateVolumeConfig,
    inputFields: [
        { key: 'volumeName', labelKey: 'pipeline.inputs.volumeName', descriptionKey: 'pipeline.inputs.desc_volumeName', type: 'input' },
    ],
};