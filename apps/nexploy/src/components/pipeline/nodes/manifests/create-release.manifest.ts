import { Position } from '@xyflow/react';
import { createReleaseConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { CreateReleaseConfig } from '../config/CreateReleaseConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { PackageCheck } from 'lucide-react';

export const createReleaseManifest: NodeManifest = {
    type: 'create-release',
    definition: {
        id: 'create-release',
        type: 'base-node',
        category: 'integration',
        metadata: {
            name: 'create-release.name',
            description: 'create-release.description',
            icon: PackageCheck,
            color: `${CATEGORY_BG_MUTED['integration']} ${CATEGORY_TEXT['integration']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: createReleaseConfigSchema,
    configPanel: CreateReleaseConfig,
    inputFields: [
        {
            key: 'releaseId',
            labelKey: 'pipeline.inputs.releaseId',
            descriptionKey: 'pipeline.inputs.desc_releaseId',
            type: 'input',
        },
        {
            key: 'releaseUrl',
            labelKey: 'pipeline.inputs.releaseUrl',
            descriptionKey: 'pipeline.inputs.desc_releaseUrl',
            type: 'input',
        },
        {
            key: 'tagName',
            labelKey: 'pipeline.inputs.tagName',
            descriptionKey: 'pipeline.inputs.desc_tagName',
            type: 'input',
        },
    ],
};
